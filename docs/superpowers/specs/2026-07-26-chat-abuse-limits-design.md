# Chat API abuse protection + bring-your-own-key

**Date:** 2026-07-26
**Status:** Approved
**Goal:** Before deploying to Vercel, make it impossible for any user (or bot) to burn meaningful NVIDIA API credits through the owner's shared key, while giving power users an unlimited path by adding their own key.

## Threat model

1. **Credit burn:** a single account (or script) hammering `/api/chat` or `/api/ai/word-helper`, each call spending the owner's NVIDIA credits.
2. **Multi-account botting:** scripted signups (registration is open) to multiply per-account allowances.
3. **Token amplification:** oversized messages and ever-growing conversation history inflating tokens per call.

The existing in-memory limiter ([lib/rateLimit.js](../../../lib/rateLimit.js)) is per-instance and resets on every serverless cold start, so on Vercel it provides burst-braking only — it cannot enforce any durable cap. All durable counters below live in MongoDB (shared across instances); no new external services.

## Limits (final numbers)

| What | Limit | Scope | Storage |
|---|---|---|---|
| AI chat messages | **50 lifetime** | per account, only on owner's key | `User.aiChatsUsed` field |
| Word-helper calls | **50 lifetime** | per account, only on owner's key | `User.aiHelperUsed` field |
| All AI calls (chat + helper) | **200 lifetime** | per client IP, only on owner's key | `AiUsage` collection (no expiry) |
| Chat message length | **2,000 chars** | per request | validation only |
| History sent to model | **last 12 messages** | per request | slice before invoke |
| Existing per-minute burst limits | 20/min chat, 15/min helper | per account, always (BYOK too) | in-memory (unchanged) |

Nothing resets on a schedule — every quota is a lifetime budget, so the absolute worst-case spend on the owner's key is hard-bounded. Requests made with a user's **own** key skip all lifetime caps and the IP umbrella — but still pass the per-minute burst limits (protects server resources, not credits).

## Components

### 1. Lifetime per-account counters — `User.aiChatsUsed` / `User.aiHelperUsed`

- Two new fields on [models/User.js](../../../models/User.js): `aiChatsUsed: { type: Number, default: 0 }` and `aiHelperUsed: { type: Number, default: 0 }`.
- Consumed with one race-safe atomic op per request, e.g. in the chat POST route:
  `User.findOneAndUpdate({ _id: userId, aiChatsUsed: { $lt: 50 } }, { $inc: { aiChatsUsed: 1 } }, { new: true })`.
  A `null` result means the budget is exhausted → 429 `{ error, code: "TRIAL_EXHAUSTED" }` (chat) / `code: "HELPER_LIMIT"` (word-helper, same pattern on `aiHelperUsed`). A shared `lifetimeQuota(userId, field, limit)` helper in a new [lib/quota.js](../../../lib/quota.js) wraps this.
- Incremented **before** the model call (a request that reaches NVIDIA always counts). Never incremented when the user's own key is used, so removing a BYOK key later restores the untouched remaining balance.
- Deleted automatically with the account (they are part of the User document). Deliberate consequence: deleting and re-registering an account does reset the per-account budgets — the per-IP umbrella below is what bounds that loop.

### 2. Lifetime per-IP counter — new `AiUsage` model

- New model [models/AiUsage.js](../../../models/AiUsage.js), collection `ai_usages`:
  `{ key: String (unique), count: Number }`. No TTL, no expiry — lifetime by design.
- Key format: `ai:ip:<ip>` (no date component). IP comes from the existing `clientIp(req)`.
- New helper `ipQuota(ip, limit)` in [lib/quota.js](../../../lib/quota.js): one atomic `findOneAndUpdate` with `$inc: { count: 1 }`, `upsert: true, new: true`; over-limit when `count > limit`. Race-safe across instances because Mongo applies `$inc` atomically.
- Over limit → 429 with `code: "IP_LIMIT"`.
- Rows are one tiny document per IP ever seen — unbounded in principle, negligible in practice; no cascade on account deletion needed.
- **Accepted trade-off:** a lifetime IP cap never resets, so a shared IP (campus/office NAT, carrier CGNAT) permanently exhausts its 200 free calls for everyone behind it. Intended: the goal is a hard ceiling on total owner-key spend, and affected users always have the BYOK path.

### 3. Bring-your-own-key (BYOK) — multi-provider

All four supported providers speak the OpenAI-compatible protocol the app already uses, so there is **one code path** (`ChatOpenAI` with a per-provider `baseURL`) and zero new dependencies.

**Provider map** — a fixed table in a new [lib/providers.js](../../../lib/providers.js):

| Provider id | Base URL | Default model | Key prefix |
|---|---|---|---|
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_MODEL` env or `meta/llama-3.3-70b-instruct` | `nvapi-` |
| `openai` | `https://api.openai.com/v1` | `gpt-4o-mini` | `sk-` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.5-flash` | `AIza` |
| `anthropic` | `https://api.anthropic.com/v1/` (official OpenAI SDK compatibility layer) | `claude-haiku-4-5-20251001` | `sk-ant-` |

- New fields on `User`:
  - `aiProvider: { type: String, enum: ["nvidia", "openai", "gemini", "anthropic"] }`
  - `aiApiKey: { type: String, select: false }` storing `iv:tag:ciphertext` (base64), AES-256-GCM, key = SHA-256 of `NEXTAUTH_SECRET`. Crypto helpers (`encryptSecret`/`decryptSecret`, Node `crypto`) live in a new [lib/secrets.js](../../../lib/secrets.js) (quota logic stays in `lib/quota.js`).
  - `aiModel: { type: String }` — optional model override; empty = the provider's default. Max 100 chars, charset `[A-Za-z0-9._:/-]`.
  - If `NEXTAUTH_SECRET` rotates, stored keys fail to decrypt → treat as "no key" (fall back to owner key + caps) and let the user re-add. Never crash on decrypt failure.
- **API:** new route `app/api/account/api-key/route.js`:
  - `PUT { provider, apiKey, model? }` — provider must be in the map; key must be a string, length 10–512, and start with the provider's prefix (catches paste-into-wrong-provider mistakes); encrypt and save all three fields. Responds with `{ provider, masked, model }` only.
  - `DELETE` — unsets all three fields.
  - `GET` — returns `{ provider, masked: "sk-••••1234" | null, model }` (last 4 chars only). The full key is **never** sent to the client after save.
  - Standard route conventions: session check, `connectDB()`, scoped to `session.user.id`, try/catch → generic 500.
- **Usage:** chat POST and word-helper POST fetch the user with `.select("+aiApiKey")`, decrypt, resolve `{ apiKey, baseURL, model }` from the provider map, and pass it through: `streamVocaChat(message, sessionId, { apiKey, baseURL, model })` / `generateWordHelp(word, { ... })`. In [lib/langchain.js](../../../lib/langchain.js) these default to the owner's NVIDIA config.
- A 401/403 from the provider while using a BYOK key → error message naming the chosen provider and pointing to Settings (chat route's existing pre-stream error path already returns JSON before headers are sent).
- **Settings UI:** new "AI API key" card: provider dropdown, password-type key input, optional model field (placeholder = the provider default), Save / Remove buttons, masked display + provider name when a key exists, one line explaining that adding a key removes the free limits (and that NVIDIA keys are free at build.nvidia.com). Follows existing semantic-token styling (`bg-surface`, `text-muted`, …).

### 4. Input/token hardening

- Chat POST rejects `message.length > 2000` with 400 (word-helper already caps at 60 chars).
- [lib/langchain.js](../../../lib/langchain.js) `streamVocaChat`: pass `past.slice(-12)` to the prompt instead of the full history. Stored history remains complete; only the model context is windowed.

### 5. Capped-state UX (chat page)

- Every successful chat response (on the owner's key) includes `X-Free-Chats-Remaining: <n>`.
- The chat UI shows a quiet "N free chats left" indicator once the header is seen (hidden for BYOK users; nothing shown until the first response).
- On 429 `TRIAL_EXHAUSTED`, the composer area shows: *"You've used all 50 free AI chats. Add your own API key (NVIDIA, OpenAI, Gemini, or Claude) in Settings to keep chatting — NVIDIA keys are free at build.nvidia.com."* with a link to `/settings`.
- On 429 `HELPER_LIMIT`, the word card's AI-help area shows the returned message: *"You've used all 50 free AI word helps. Add your own API key in Settings to keep going."*
- Other 429 codes (burst, `IP_LIMIT`) reuse the existing "slow down" toast behavior.

## Order of checks in the chat POST

1. Session (401) → 2. body parse + length validation (400) → 3. per-minute burst limit (429) → 4. `connectDB()`, load user incl. key → 5. if BYOK: skip to 7 → 6. IP umbrella, then lifetime chat counter (429s; IP check first so exhausted-trial accounts still consume the IP budget) → 7. conversation resolve → 8. stream.

Word-helper: session → burst limit → validation → user/key load → (if owner key) IP umbrella, then lifetime helper counter → model call.

## Error handling

- Quota checks run after `connectDB()`; if Mongo is down the request already fails before any NVIDIA spend (fail-closed by construction).
- Increment-then-call means a failed NVIDIA call still consumes one credit of the relevant lifetime budget; acceptable at these limits (no refund logic — YAGNI).

## Verification (no test framework in this repo)

1. `npm run lint` + `npm run build` clean.
2. Manual on localhost: temporarily set the lifetime cap to 2 → third chat returns 429 with the Settings prompt; counter UI shows remaining correctly.
3. Save a real key for at least one provider in Settings → chat works past the cap, `aiChatsUsed` stops incrementing, GET returns provider + masked key only. Spot-check a second provider if a key is available.
4. Remove key → capped state returns. Wrong prefix for the chosen provider → 400 on save. Well-formed but revoked key → chat surfaces the provider-named "key rejected" message.
5. 2,001-char message → 400. Word-helper past its lifetime cap (temporarily lowered to 2) → 429 with the Settings message.
6. IP umbrella (temporarily lowered) → 429 `IP_LIMIT` even from a fresh account on the same IP.

## Out of scope

- Redis/Upstash-backed per-minute limiting (documented follow-up for scale).
- CAPTCHA / email verification on signup (IP umbrella covers the credible bot vector for now).
- Refunding trial credits on failed model calls.
- Any reset mechanism for exhausted budgets (per-account or per-IP) — raising the constants and redeploying is the only lever, by design.
- Custom base URLs / self-hosted or unlisted providers (the provider map is fixed; adding one is a one-row code change).
- Admin UI for adjusting quotas (constants in code).
