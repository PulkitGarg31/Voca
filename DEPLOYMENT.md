# VOCA — Deployment Guide (Vercel)

This guide takes the app from the GitHub repo (`PulkitGarg31/Voca`) to a live
production deployment on Vercel, including database setup, environment
variables, post-deploy verification, and troubleshooting. It reflects the
codebase as of the AI-limits + bring-your-own-key release (`main @ 70ce75e`).

---

## 1. Architecture at a glance

- **Next.js 14 App Router** app — deploys to Vercel serverless functions with
  zero config (no `vercel.json` needed).
- **MongoDB Atlas** — two logical uses, one cluster: Mongoose models
  (users, words, practice sessions, conversations, `ai_usages` counters) and
  the native-driver `chat_histories` collection for LangChain chat history.
- **NVIDIA NIM** — powers AI chat and the word helper on the owner's key
  (`meta/llama-3.3-70b-instruct` by default). Users can add their own
  NVIDIA / OpenAI / Gemini / Anthropic key in Settings to bypass the free
  limits.
- **Free-tier protection** (all lifetime, never reset): 50 AI chats +
  50 word-helps per account, 200 AI calls per IP. Raising the constants in
  [lib/quota.js](lib/quota.js) and redeploying is the only reset lever.

## 2. Prerequisites

| What | Where | Notes |
|---|---|---|
| GitHub repo | github.com/PulkitGarg31/Voca | `main` is the deploy branch |
| Vercel account | vercel.com | Hobby (free) tier is sufficient |
| MongoDB Atlas cluster | cloud.mongodb.com | Free M0 tier works |
| NVIDIA API key | build.nvidia.com | Free; key starts with `nvapi-` |
| (Optional) Google OAuth client | console.cloud.google.com/apis/credentials | Only for "Continue with Google" |

## 3. MongoDB Atlas setup

1. **Cluster**: use the existing `voca` cluster or create a free M0.
2. **Database user**: Database Access → a user with read/write on the `voca`
   database. Avoid `@ : / ?` in the password, or URL-encode them.
3. **Network access** (critical): Network Access → Add IP Address →
   **Allow access from anywhere (`0.0.0.0/0`)**. Vercel functions have no
   fixed IPs — without this, every API call times out with
   `ReplicaSetNoPrimary` errors.
4. **Connection string** — two ways to get it:
   - **Shortcut**: if the app already runs locally against Atlas, the
     `MONGODB_URI` in your `.env.local` is exactly the string to use — copy
     it from there.
   - **From the Atlas UI**: left sidebar → **Clusters** → **Connect** button
     on your cluster → **Drivers** → copy the `mongodb+srv://...` string
     (there's a copy button). Replace `<password>` with the database user's
     password and make sure the path names the database:
     `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/voca`
5. **Auto-pause gotcha**: free clusters pause after inactivity. Symptoms are
   ~30s hangs and Atlas hostnames vanishing from DNS. Resume the cluster in
   the Atlas dashboard; the first request after resume is slow.

## 4. Environment variables

Set these in Vercel during import (Step 5) or later under
**Project → Settings → Environment Variables** (scope: Production).

### Required — the app throws at startup in production without these

| Variable | Value | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://…/voca` | From Atlas (Step 3.4) |
| `NEXTAUTH_SECRET` | 32+ random bytes, base64 | Generate fresh for prod (below). **Also encrypts users' stored AI keys — rotating it logs everyone out AND silently discards all saved BYOK keys** (users must re-enter them; the app degrades gracefully). |
| `NVIDIA_API_KEY` | `nvapi-…` from build.nvidia.com | **Required as of this release** — [lib/env.js](lib/env.js) fails the deploy fast rather than letting requests silently burn users' non-refundable lifetime trial credits against a dead key. |

Generate the secret (run locally, paste the output):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# or: openssl rand -base64 32
```

### Recommended

| Variable | Value | Notes |
|---|---|---|
| `NEXTAUTH_URL` | `https://<project>.vercel.app` | Your production URL. If you don't know the final URL yet, set it after the first deploy and redeploy. |
| `NVIDIA_MODEL` | `` | Optional override; this is the default anyway. |

### Optional — Google sign-in

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud OAuth client |

The "Continue with Google" button auto-enables when both are set. You must
also add the production redirect URI in the Google Cloud console:
`https://<your-domain>/api/auth/callback/google` — without it Google login
errors out. Leave both unset to hide the button entirely.

## 5. Deploy on Vercel (dashboard flow)

1. Go to **[vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
2. **Import** `PulkitGarg31/Voca`. Vercel auto-detects Next.js — do not
   change build settings (`npm run build`, output handled automatically).
3. Note the project name — the production URL becomes
   `https://<project-name>.vercel.app`.
4. Expand **Environment Variables** and add everything from Step 4.
5. Click **Deploy** and wait for the build (~1–2 min). The build log will
   show benign `Dynamic server usage` messages for API routes — Next.js
   probing dynamic routes; they are not errors.
6. **If your preferred project name was taken**, Vercel assigns a random
   production URL. `NEXTAUTH_URL` cannot change your URL — it must follow it.
   To get a nicer one: **Settings → General → Project Name** (rename; the
   default domain becomes `<new-name>.vercel.app`) or **Settings → Domains**
   (add any available `something.vercel.app` subdomain as production domain).
7. If you guessed `NEXTAUTH_URL` wrong (or skipped it): set it to the real
   URL under Settings → Environment Variables, then **Deployments → ⋯ →
   Redeploy**. **Env-var changes never apply to the running deployment — a
   redeploy is always required.**

From now on, **every push to `main` auto-deploys**.

## 6. Post-deploy smoke test

Run through this on the production URL, in order:

1. **Register** a fresh account (also proves the Mongo connection).
2. **Add a word** on the Words page (proves the dictionary route + word CRUD).
3. **Run a practice session** (flashcards or quiz) and check Statistics
   updates.
4. **Send a chat message** — the reply must stream in token by token, and the
   footer should show "49 free chats left".
5. **AI help on a word card** — examples + mnemonic appear.
6. **Settings → AI API key** — save a key (any supported provider), confirm
   the card flips to the masked view, chat works without the counter, then
   remove it.
7. **(If Google OAuth configured)** log out and sign in with Google.

If any step fails, check **Vercel → Project → Logs** (function logs) first —
every API route logs its errors there.

## 7. Operational notes & known limits

- **Lifetime quotas are the product design, not a bug**: exhausted accounts
  and IPs stay exhausted. The only levers are the constants in
  [lib/quota.js](lib/quota.js) (`chat: 50, helper: 50, ip: 200`) — change and
  redeploy. Per-account counters live on the `users` documents
  (`aiChatsUsed`, `aiHelperUsed`); per-IP counters in the `ai_usages`
  collection. Deleting an account resets its counters (the IP umbrella is
  what bounds re-registration abuse).
- **Shared-IP caveat**: one IP (campus NAT, office, CGNAT) exhausting its 200
  calls is permanent for everyone behind it — accepted trade-off; affected
  users can always add their own key.
- **In-memory rate limiter** ([lib/rateLimit.js](lib/rateLimit.js)) is
  per-serverless-instance on Vercel, so the per-minute burst limits are soft
  in production. The durable lifetime quotas above are the real protection.
  Follow-up if scale demands it: move burst limiting to Upstash Redis.
- **If streaming chat replies get cut off** mid-response on Vercel, add
  `export const maxDuration = 60;` to [app/api/chat/route.js](app/api/chat/route.js)
  and redeploy (older function defaults can cap execution at 10s).
- **Gemini BYOK facts** (live-verified July 2026, encoded in the codebase):
  Google now issues `AQ.`-prefixed keys (`AIza` keys die Sept 2026); its
  OpenAI-compat endpoint returns 400/404 (never 401) for bad keys/models; the
  default model is the `gemini-flash-latest` alias on purpose — the pinned
  `gemini-2.5-flash` was retired for new users while still appearing in the
  models list; and LangChain's default `frequency_penalty` param is stripped
  for Gemini requests ([lib/langchain.js](lib/langchain.js) —
  `GeminiChatOpenAI`). Don't "simplify" any of this away.
- **Users' AI keys** are AES-256-GCM encrypted at rest with a key derived
  from `NEXTAUTH_SECRET`, stored with `select: false`, and only ever returned
  masked. See the rotation warning in Step 4.
- **CI** (GitHub Actions) runs lint + build with dummy env vars on every push
  and PR — including a dummy `NVIDIA_API_KEY`, which the production env check
  now requires.

## 8. Custom domain (optional)

Vercel → Project → Settings → Domains → add your domain and follow the DNS
instructions. Afterwards update:
1. `NEXTAUTH_URL` to `https://your-domain.com` (+ redeploy).
2. The Google OAuth redirect URI (if using Google sign-in).

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails: `Missing required environment variables` | A required var absent in Vercel | Add it (Step 4), redeploy |
| Every API call 500s / times out | Atlas network access or paused cluster | Allow `0.0.0.0/0`; resume cluster |
| Login works locally, fails in prod | `NEXTAUTH_URL` wrong or missing | Set to the exact production URL, redeploy |
| Protected tabs bounce to /login right after a domain change | Session cookies are per-domain — the browser has no session on the new URL | Just log in again on the new domain (clear site cookies if it persists) |
| One-off 500 on the first request after idle | Serverless cold start + Atlas first connection | Retry; resume the cluster if it was auto-paused |
| Google login error page | Redirect URI not registered | Add `https://<domain>/api/auth/callback/google` in Google console |
| Chat replies cut off mid-stream | Function duration cap | `export const maxDuration = 60;` in the chat route |
| User reports "used all 50 free chats" but is new | They share an exhausted IP, or re-registered after exhausting | Working as designed; they can add their own key |
| Gemini BYOK "key rejected" | Bad/old key, or retired model override | Re-mint key at aistudio.google.com; clear the model override |
