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
| Word-helper calls | **30 / day** | per account, only on owner's key | `AiUsage` collection (TTL) |
| All AI calls (chat + helper) | **150 / day** | per client IP, only on owner's key | `AiUsage` collection (TTL) |
| Chat message length | **2,000 chars** | per request | validation only |
| History sent to model | **last 12 messages** | per request | slice before invoke |
| Existing per-minute burst limits | 20/min chat, 15/min helper | per account, always (BYOK too) | in-memory (unchanged) |

Requests made with a user's **own** key skip the lifetime cap, the daily cap, and the IP umbrella — but still pass the per-minute burst limits (protects server resources, not credits).

## Components

### 1. Lifetime chat counter — `User.aiChatsUsed`

- New field on [models/User.js](../../../models/User.js): `aiChatsUsed: { type: Number, default: 0 }`.
- Consumed in the chat POST route with one race-safe atomic op:
  `User.findOneAndUpdate({ _id: userId, aiChatsUsed: { $lt: 50 } }, { $inc: { aiChatsUsed: 1 } }, { new: true })`.
  A `null` result means the trial is exhausted → 429 `{ error, code: "TRIAL_EXHAUSTED" }`.
- Incremented **before** the model call (a request that reaches NVIDIA always counts). Never incremented when the user's own key is used, so removing a BYOK key later restores the untouched trial balance.
- Deleted automatically with the account (it is part of the User document).

### 2. Daily counters — new `AiUsage` model

- New model [models/AiUsage.js](../../../models/AiUsage.js), collection `ai_usages`:
  `{ key: String (unique), count: Number, expiresAt: Date }` with a TTL index on `expiresAt` (`expireAfterSeconds: 0`).
- Key formats: `helper:u:<userId>:<YYYY-MM-DD>` and `ai:ip:<ip>:<YYYY-MM-DD>` (UTC dates).
- New helper `dailyQuota(key, limit)` in a new [lib/quota.js](../../../lib/quota.js) (also home of the lifetime-counter helper): one atomic `findOneAndUpdate` with `$inc: { count: 1 }`, `$setOnInsert: { expiresAt: <next UTC midnight> }`, `upsert: true, new: true`; returns over-limit when `count > limit`. Race-safe across instances because Mongo applies `$inc` atomically.
- Over limit → 429 with `code: "DAILY_LIMIT"` (helper) or `code: "IP_LIMIT"` (umbrella). IP comes from the existing `clientIp(req)`.
- `AiUsage` rows are not user-owned data requiring cascade on account deletion; the TTL removes them within 24h.

### 3. Bring-your-own-key (BYOK)

- New field on `User`: `nvidiaApiKey: { type: String, select: false }` storing `iv:tag:ciphertext` (base64), AES-256-GCM, key = SHA-256 of `NEXTAUTH_SECRET`. Crypto helpers (`encryptSecret`/`decryptSecret`, Node `crypto`) live in a new [lib/secrets.js](../../../lib/secrets.js) (quota logic stays in `lib/quota.js`).
  - If `NEXTAUTH_SECRET` rotates, stored keys fail to decrypt → treat as "no key" (fall back to owner key + caps) and let the user re-add. Never crash on decrypt failure.
- **API:** new route `app/api/account/api-key/route.js`:
  - `PUT { apiKey }` — must be a string, start with `nvapi-`, length 20–256; encrypt and save. Responds with the masked form only.
  - `DELETE` — unsets the field.
  - `GET` — returns `{ masked: "nvapi-••••1234" | null }` (last 4 chars only). The full key is **never** sent to the client after save.
  - Standard route conventions: session check, `connectDB()`, scoped to `session.user.id`, try/catch → generic 500.
- **Usage:** chat POST and word-helper POST fetch the user with `.select("+nvidiaApiKey")`, decrypt, and pass the key through: `streamVocaChat(message, sessionId, { apiKey })` / `generateWordHelp(word, { apiKey })`. In [lib/langchain.js](../../../lib/langchain.js), `apiKey` defaults to `process.env.NVIDIA_API_KEY`.
- A 401/403 from NVIDIA while using a BYOK key → error message telling the user their key was rejected, pointing to Settings (chat route's existing pre-stream error path already returns JSON before headers are sent).
- **Settings UI:** new "AI API key" card on the settings page: password-type input, Save / Remove buttons, masked display when a key exists, one line explaining that a key from build.nvidia.com removes the free-chat limit. Follows existing semantic-token styling (`bg-surface`, `text-muted`, …).

### 4. Input/token hardening

- Chat POST rejects `message.length > 2000` with 400 (word-helper already caps at 60 chars).
- [lib/langchain.js](../../../lib/langchain.js) `streamVocaChat`: pass `past.slice(-12)` to the prompt instead of the full history. Stored history remains complete; only the model context is windowed.

### 5. Capped-state UX (chat page)

- Every successful chat response (on the owner's key) includes `X-Free-Chats-Remaining: <n>`.
- The chat UI shows a quiet "N free chats left" indicator once the header is seen (hidden for BYOK users; nothing shown until the first response).
- On 429 `TRIAL_EXHAUSTED`, the composer area shows: *"You've used all 50 free AI chats. Add your own NVIDIA API key in Settings to keep chatting — it's free at build.nvidia.com."* with a link to `/settings`. Other 429 codes reuse the existing "slow down" toast behavior.

## Order of checks in the chat POST

1. Session (401) → 2. body parse + length validation (400) → 3. per-minute burst limit (429) → 4. `connectDB()`, load user incl. key → 5. if BYOK: skip to 7 → 6. IP umbrella, then lifetime counter (429s; IP check first so exhausted-trial users don't dodge the umbrella probe) → 7. conversation resolve → 8. stream.

Word-helper: session → burst limit → validation → user/key load → (if owner key) IP umbrella + daily quota → model call.

## Error handling

- Quota checks run after `connectDB()`; if Mongo is down the request already fails before any NVIDIA spend (fail-closed by construction).
- Increment-then-call means a failed NVIDIA call still consumes one trial credit; acceptable at these limits (no refund logic — YAGNI).

## Verification (no test framework in this repo)

1. `npm run lint` + `npm run build` clean.
2. Manual on localhost: temporarily set the lifetime cap to 2 → third chat returns 429 with the Settings prompt; counter UI shows remaining correctly.
3. Save a real NVIDIA key in Settings → chat works past the cap, `aiChatsUsed` stops incrementing, GET returns only the masked key.
4. Remove key → capped state returns. Invalid key (`nvapi-junk`) → chat surfaces the "key rejected" message.
5. 2,001-char message → 400. Word-helper 31st call same UTC day (cap temporarily lowered) → 429.

## Out of scope

- Redis/Upstash-backed per-minute limiting (documented follow-up for scale).
- CAPTCHA / email verification on signup (IP umbrella covers the credible bot vector for now).
- Refunding trial credits on failed model calls.
- Admin UI for adjusting quotas (constants in code).
