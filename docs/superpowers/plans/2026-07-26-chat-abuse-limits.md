# Chat API Abuse Limits + Multi-Provider BYOK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce lifetime AI budgets (50 chats + 50 word-helps per account, 200 calls per IP) that survive serverless restarts, and let users add their own NVIDIA/OpenAI/Gemini/Anthropic API key in Settings to bypass them.

**Architecture:** Durable counters live in MongoDB — per-account budgets as fields on the `User` document (atomic `$inc` with `$lt` guard), the per-IP budget in a tiny new `AiUsage` collection. BYOK uses one `ChatOpenAI` code path with a fixed provider→baseURL map (all four providers are OpenAI-compatible); keys are AES-256-GCM-encrypted at rest. Spec: [docs/superpowers/specs/2026-07-26-chat-abuse-limits-design.md](../specs/2026-07-26-chat-abuse-limits-design.md).

**Tech Stack:** Next.js 14 App Router (JS, not TS), Mongoose, LangChain `ChatOpenAI`, Node `crypto`. **No test framework exists in this repo (per CLAUDE.md)** — the verification bar is `npm run lint` + `npm run build` + the manual checklist in Task 10. Run `npm run lint` after every task; the full build runs in Task 10.

**Conventions that apply to every task:** `@/*` maps to repo root. Every API route: `getServerSession(authOptions)` → 401 if no `session.user.id`, `await connectDB()` before model access, scope queries by `session.user.id`, try/catch → `console.error` + generic 500. Commit after every task with the trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Secret encryption helpers

**Files:**
- Create: `lib/secrets.js`

- [ ] **Step 1: Create `lib/secrets.js`**

```js
import crypto from "crypto";

// AES-256-GCM with a key derived from NEXTAUTH_SECRET.
// Stored format: "iv:tag:ciphertext" (each base64).
function derivedKey() {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not set");
  return crypto.createHash("sha256").update(process.env.NEXTAUTH_SECRET).digest();
}

export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

// Returns the plaintext, or null when the value is missing, corrupt, or was
// encrypted under a rotated NEXTAUTH_SECRET — callers treat null as "no key".
export function decryptSecret(stored) {
  try {
    const [iv, tag, data] = String(stored).split(":").map((p) => Buffer.from(p, "base64"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit**

```bash
git add lib/secrets.js
git commit -m "feat: AES-256-GCM secret helpers for stored API keys"
```

---

### Task 2: Quota infrastructure (User fields, AiUsage model, quota lib)

**Files:**
- Modify: `models/User.js` (schema object, after the `stats` block ending at line 25)
- Create: `models/AiUsage.js`
- Create: `lib/quota.js`

- [ ] **Step 1: Add fields to `models/User.js`**

In the schema definition, insert after the closing `},` of the `stats` block (line 25) and before the closing `},` of the schema object:

```js
    // Lifetime free-AI budgets (consumed only on the owner's key; BYOK
    // requests never count). No resets, by design — see the 2026-07-26 spec.
    aiChatsUsed: { type: Number, default: 0 },
    aiHelperUsed: { type: Number, default: 0 },

    // Bring-your-own-key: provider id + encrypted key + optional model override
    aiProvider: { type: String, enum: ["nvidia", "openai", "gemini", "anthropic"] },
    aiApiKey: { type: String, select: false }, // "iv:tag:ciphertext", AES-256-GCM
    aiModel: { type: String, default: "" },
```

- [ ] **Step 2: Create `models/AiUsage.js`**

```js
import mongoose from "mongoose";

// Lifetime counters not tied to a single user (currently: per-IP AI budget).
// One tiny doc per key; no TTL — these never reset, by design.
const AiUsageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
});

export default mongoose.models.AiUsage || mongoose.model("AiUsage", AiUsageSchema);
```

- [ ] **Step 3: Create `lib/quota.js`**

```js
import User from "@/models/User";
import AiUsage from "@/models/AiUsage";

// Lifetime free-AI budgets (owner's key only). Raising these constants and
// redeploying is the only reset lever, by design.
export const LIMITS = {
  chat: 50,   // AI chat messages per account
  helper: 50, // word-helper calls per account
  ip: 200,    // all AI calls per client IP
};

// Atomically consume one unit of a per-account budget. `field` is
// "aiChatsUsed" or "aiHelperUsed". Returns { ok, remaining }; ok:false means
// the budget was already exhausted (and nothing was consumed).
export async function lifetimeQuota(userId, field, limit) {
  // $exists:false counts missing fields as zero — pre-existing accounts
  // created before this schema change must still get their free budget.
  const updated = await User.findOneAndUpdate(
    { _id: userId, $or: [{ [field]: { $lt: limit } }, { [field]: { $exists: false } }] },
    { $inc: { [field]: 1 } },
    { new: true }
  ).select(field);
  if (!updated) return { ok: false, remaining: 0 };
  return { ok: true, remaining: Math.max(0, limit - updated[field]) };
}

// Atomically consume one unit of the per-IP budget. ok:false when over.
export async function ipQuota(ip, limit) {
  const doc = await AiUsage.findOneAndUpdate(
    { key: `ai:ip:${ip}` },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  return { ok: doc.count <= limit };
}
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 5: Commit**

```bash
git add models/User.js models/AiUsage.js lib/quota.js
git commit -m "feat: lifetime AI quota counters (per-account fields + per-IP AiUsage)"
```

---

### Task 3: Provider map

**Files:**
- Create: `lib/providers.js`

- [ ] **Step 1: Create `lib/providers.js`**

```js
import { decryptSecret } from "@/lib/secrets";

// Fixed BYOK provider map. All four expose OpenAI-compatible endpoints, so a
// single ChatOpenAI code path serves every row. Adding a provider = one row.
export const PROVIDERS = {
  nvidia: {
    label: "NVIDIA NIM",
    baseURL: "https://integrate.api.nvidia.com/v1",
    defaultModel: () => process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
    keyPrefix: "nvapi-",
  },
  openai: {
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    defaultModel: () => "gpt-4o-mini",
    keyPrefix: "sk-",
  },
  gemini: {
    label: "Google Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: () => "gemini-2.5-flash",
    keyPrefix: "AIza",
  },
  anthropic: {
    // Official OpenAI SDK compatibility layer.
    label: "Anthropic Claude",
    baseURL: "https://api.anthropic.com/v1/",
    defaultModel: () => "claude-haiku-4-5-20251001",
    keyPrefix: "sk-ant-",
  },
};

export const MODEL_NAME_RE = /^[A-Za-z0-9._:/-]{1,100}$/;

// Resolve a user's BYOK config from a User doc loaded with `+aiApiKey`.
// Returns { apiKey, baseURL, model, provider, label } or null when the user
// has no usable key (missing, unknown provider, or undecryptable).
export function resolveByok(user) {
  const p = PROVIDERS[user?.aiProvider];
  if (!p || !user?.aiApiKey) return null;
  const apiKey = decryptSecret(user.aiApiKey);
  if (!apiKey) return null;
  return {
    apiKey,
    baseURL: p.baseURL,
    model: user.aiModel || p.defaultModel(),
    provider: user.aiProvider,
    label: p.label,
  };
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit**

```bash
git add lib/providers.js
git commit -m "feat: BYOK provider map (NVIDIA/OpenAI/Gemini/Anthropic, OpenAI-compat)"
```

---

### Task 4: langchain.js — per-request AI config + history window

**Files:**
- Modify: `lib/langchain.js`

- [ ] **Step 1: Add `ownerConfig()` above `streamVocaChat` (after the `getHistory` function, ~line 51)**

```js
// Owner-key config (NVIDIA). BYOK requests pass their own {apiKey, baseURL, model}.
function ownerConfig() {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set in .env.local");
  }
  return {
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
    model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
  };
}
```

- [ ] **Step 2: Rework `streamVocaChat`**

Change the signature and replace the env check + model construction. Old code (lines 58–71):

```js
export async function* streamVocaChat(userMessage, sessionId) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set in .env.local");
  }

  const model = new ChatOpenAI({
    // NVIDIA NIM is OpenAI-compatible; override the model via env.
    model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,
    temperature: 0.7,
    maxTokens: 1024,
    streaming: true,
    configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
  });
```

New code:

```js
// `ai` (optional): {apiKey, baseURL, model} from a user's own key; null = owner key.
export async function* streamVocaChat(userMessage, sessionId, ai = null) {
  const cfg = ai || ownerConfig();
  const model = new ChatOpenAI({
    model: cfg.model,
    apiKey: cfg.apiKey,
    temperature: 0.7,
    maxTokens: 1024,
    streaming: true,
    configuration: { baseURL: cfg.baseURL },
  });
```

- [ ] **Step 3: Window the history**

Old (line 80): `const past = await history.getMessages();`
New:

```js
  // Window what goes upstream: full history is still stored, but only the
  // last 12 messages ride along per request, capping token cost per call.
  const past = (await history.getMessages()).slice(-12);
```

- [ ] **Step 4: Rework `generateWordHelp` the same way**

Old (lines 107–117):

```js
export async function generateWordHelp(word) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set in .env.local");
  }
  const model = new ChatOpenAI({
    model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,
    temperature: 0.8,
    maxTokens: 400,
    configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
  });
```

New:

```js
export async function generateWordHelp(word, ai = null) {
  const cfg = ai || ownerConfig();
  const model = new ChatOpenAI({
    model: cfg.model,
    apiKey: cfg.apiKey,
    temperature: 0.8,
    maxTokens: 400,
    configuration: { baseURL: cfg.baseURL },
  });
```

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 6: Commit**

```bash
git add lib/langchain.js
git commit -m "feat: per-request AI provider config + 12-message history window"
```

---

### Task 5: API-key management route

**Files:**
- Create: `app/api/account/api-key/route.js`

- [ ] **Step 1: Create the route**

```js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { PROVIDERS, MODEL_NAME_RE } from "@/lib/providers";

// The full key is NEVER returned after save — masked form only.
function mask(key) {
  return key.length > 8 ? `${key.slice(0, 3)}••••${key.slice(-4)}` : "••••";
}

// GET /api/account/api-key — BYOK status: { provider, masked, model }.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id).select("+aiApiKey");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const key = user.aiApiKey ? decryptSecret(user.aiApiKey) : null;
    if (!key) return NextResponse.json({ provider: null, masked: null, model: "" });
    return NextResponse.json({ provider: user.aiProvider, masked: mask(key), model: user.aiModel || "" });
  } catch (err) {
    console.error("API key GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/account/api-key { provider, apiKey, model? } — save/replace own key.
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const provider = body.provider;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";

    const p = PROVIDERS[provider];
    if (!p) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    if (apiKey.length < 10 || apiKey.length > 512) {
      return NextResponse.json({ error: "That key doesn't look valid" }, { status: 400 });
    }
    if (!apiKey.startsWith(p.keyPrefix)) {
      return NextResponse.json(
        { error: `${p.label} keys start with "${p.keyPrefix}" — check you picked the right provider` },
        { status: 400 }
      );
    }
    if (model && !MODEL_NAME_RE.test(model)) {
      return NextResponse.json({ error: "Invalid model name" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      aiProvider: provider,
      aiApiKey: encryptSecret(apiKey),
      aiModel: model,
    });
    return NextResponse.json({ provider, masked: mask(apiKey), model });
  } catch (err) {
    console.error("API key PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/account/api-key — remove own key (free budgets apply again).
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      $unset: { aiProvider: "", aiApiKey: "", aiModel: "" },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API key DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit**

```bash
git add app/api/account/api-key/route.js
git commit -m "feat: API-key management route (save/mask/remove BYOK key)"
```

---

### Task 6: Chat route — length cap, BYOK, quotas, remaining header

**Files:**
- Modify: `app/api/chat/route.js` (imports + the whole `POST` function; `GET`/`DELETE` untouched)

- [ ] **Step 1: Extend imports**

Old:

```js
import { rateLimited } from "@/lib/rateLimit";
```

New:

```js
import { rateLimited, clientIp } from "@/lib/rateLimit";
import User from "@/models/User";
import { resolveByok } from "@/lib/providers";
import { lifetimeQuota, ipQuota, LIMITS } from "@/lib/quota";
```

- [ ] **Step 2: Replace the entire `POST` function**

The comment block above it and the `GET`/`DELETE` handlers stay as-is. New `POST`:

```js
export async function POST(req) {
  let byok = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { message, conversationId: incomingId } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message is too long (max 2,000 characters)." }, { status: 400 });
    }

    const limited = rateLimited(`chat:${userId}`, { limit: 20, windowMs: 60_000 });
    if (limited) return limited;

    await connectDB();

    const user = await User.findById(userId).select("+aiApiKey");
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    byok = resolveByok(user);

    // Free lifetime budgets bind only when the request runs on the owner's
    // key. IP umbrella first: exhausted-trial accounts still consume it.
    let freeRemaining = null;
    if (!byok) {
      const ipOk = await ipQuota(clientIp(req), LIMITS.ip);
      if (!ipOk.ok) {
        return NextResponse.json(
          { error: "The free AI limit for your network has been reached. Add your own API key in Settings to keep chatting.", code: "IP_LIMIT" },
          { status: 429 }
        );
      }
      const quota = await lifetimeQuota(userId, "aiChatsUsed", LIMITS.chat);
      if (!quota.ok) {
        return NextResponse.json(
          { error: "You've used all 50 free AI chats. Add your own API key (NVIDIA, OpenAI, Gemini, or Claude) in Settings to keep chatting — NVIDIA keys are free at build.nvidia.com.", code: "TRIAL_EXHAUSTED" },
          { status: 429 }
        );
      }
      freeRemaining = quota.remaining;
    }

    // Resolve the conversation: continue an owned one, or start a new thread.
    let convo = null;
    if (incomingId) {
      convo = await ChatConversation.findOne({ userId, conversationId: incomingId });
      if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    } else {
      convo = await ChatConversation.create({
        userId,
        conversationId: randomUUID(),
        title: deriveTitle(message),
      });
    }

    // Await the first chunk before sending headers: config/connection errors
    // (bad API key, model down) still surface as a clean JSON 500.
    const gen = streamVocaChat(message, convo.conversationId, byok);
    const first = await gen.next();

    // Bump recency so it sorts to the top of the recent list.
    convo.lastMessageAt = new Date();
    await convo.save();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!first.done) controller.enqueue(encoder.encode(first.value));
          for await (const chunk of gen) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          console.error("Chat stream error:", err);
          try {
            controller.enqueue(encoder.encode("\n\n[Response interrupted. Please try again.]"));
          } catch {}
        } finally {
          try { controller.close(); } catch {}
        }
      },
      cancel() {
        // Client disconnected: stop the model stream; the generator's finally
        // block persists the partial reply.
        gen.return?.();
      },
    });

    const headers = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Conversation-Id": convo.conversationId,
    };
    if (freeRemaining !== null) headers["X-Free-Chats-Remaining"] = String(freeRemaining);

    return new Response(stream, { headers });
  } catch (err) {
    console.error("Chat error:", err);
    const status = err?.status ?? err?.response?.status;
    if (byok && (status === 401 || status === 403)) {
      return NextResponse.json(
        { error: `Your ${byok.label} API key was rejected. Check it in Settings.` },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: err.message || "AI response failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.js
git commit -m "feat: enforce lifetime chat budget, IP umbrella and BYOK in chat route"
```

---

### Task 7: Word-helper route — BYOK + quotas

**Files:**
- Modify: `app/api/ai/word-helper/route.js` (full file replacement)

- [ ] **Step 1: Replace the file contents**

```js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateWordHelp } from "@/lib/langchain";
import { rateLimited, clientIp } from "@/lib/rateLimit";
import { resolveByok } from "@/lib/providers";
import { lifetimeQuota, ipQuota, LIMITS } from "@/lib/quota";

// POST /api/ai/word-helper — AI example sentences + mnemonic for a word
export async function POST(req) {
  let byok = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = rateLimited(`ai-helper:${session.user.id}`, { limit: 15, windowMs: 60_000 });
    if (limited) return limited;

    const { word } = await req.json();
    if (typeof word !== "string" || !word.trim() || word.length > 60) {
      return NextResponse.json({ error: "A valid word is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("+aiApiKey");
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    byok = resolveByok(user);

    // Free lifetime budgets bind only on the owner's key (IP umbrella first).
    if (!byok) {
      const ipOk = await ipQuota(clientIp(req), LIMITS.ip);
      if (!ipOk.ok) {
        return NextResponse.json(
          { error: "The free AI limit for your network has been reached. Add your own API key in Settings.", code: "IP_LIMIT" },
          { status: 429 }
        );
      }
      const quota = await lifetimeQuota(session.user.id, "aiHelperUsed", LIMITS.helper);
      if (!quota.ok) {
        return NextResponse.json(
          { error: "You've used all 50 free AI word helps. Add your own API key in Settings to keep going.", code: "HELPER_LIMIT" },
          { status: 429 }
        );
      }
    }

    const text = await generateWordHelp(word.trim(), byok);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("AI word-helper error:", err);
    const status = err?.status ?? err?.response?.status;
    if (byok && (status === 401 || status === 403)) {
      return NextResponse.json(
        { error: `Your ${byok.label} API key was rejected. Check it in Settings.` },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
```

(The WordCard UI already renders `data.error` from this route — the `HELPER_LIMIT` message surfaces with no client change.)

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit**

```bash
git add app/api/ai/word-helper/route.js
git commit -m "feat: enforce lifetime helper budget, IP umbrella and BYOK in word-helper"
```

---

### Task 8: Settings UI — "AI API key" card

**Files:**
- Modify: `app/(dashboard)/settings/page.jsx`

- [ ] **Step 1: Add the provider list constant**

Directly above `export default function SettingsPage() {`:

```js
// Client-side mirror of lib/providers.js (labels + input hints only).
const AI_PROVIDERS = [
  { id: "nvidia", label: "NVIDIA NIM", hint: "nvapi-…", defaultModel: "meta/llama-3.3-70b-instruct" },
  { id: "openai", label: "OpenAI", hint: "sk-…", defaultModel: "gpt-4o-mini" },
  { id: "gemini", label: "Google Gemini", hint: "AIza…", defaultModel: "gemini-2.5-flash" },
  { id: "anthropic", label: "Anthropic Claude", hint: "sk-ant-…", defaultModel: "claude-haiku-4-5-20251001" },
];
```

- [ ] **Step 2: Add state + handlers inside `SettingsPage`**

After the `const [deleting, setDeleting] = useState(false);` line:

```js
  const [ai, setAi] = useState({ provider: "nvidia", key: "", model: "" });
  const [aiSaved, setAiSaved] = useState(null); // { provider, masked, model } | null
  const [aiMsg, setAiMsg] = useState(null);
  const [savingAi, setSavingAi] = useState(false);
```

After the daily-goal `useEffect` (the one fetching `/api/account`):

```js
  // Load BYOK status (masked — the full key never reaches the client).
  useEffect(() => {
    fetch("/api/account/api-key")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.provider && setAiSaved(d))
      .catch(() => {});
  }, []);
```

After the `deleteAccount` function:

```js
  async function saveAiKey(e) {
    e.preventDefault();
    setAiMsg(null);
    setSavingAi(true);
    try {
      const res = await fetch("/api/account/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: ai.provider, apiKey: ai.key.trim(), model: ai.model.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save key");
      setAiSaved(data);
      setAi({ provider: ai.provider, key: "", model: "" });
      toast.success("API key saved — free AI limits no longer apply");
    } catch (err) {
      setAiMsg({ type: "err", text: err.message });
    } finally {
      setSavingAi(false);
    }
  }

  async function removeAiKey() {
    setSavingAi(true);
    try {
      const res = await fetch("/api/account/api-key", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAiSaved(null);
      toast.success("API key removed");
    } catch {
      toast.error("Couldn't remove the key");
    } finally {
      setSavingAi(false);
    }
  }
```

- [ ] **Step 3: Add the card JSX**

Between the Learning section's closing `</div>` (after the daily-goal block) and the `{/* Security */}` form:

```jsx
      {/* AI API key */}
      <div className="py-10 border-b border-line">
        <p className="section-label mb-6">AI API key</p>
        {aiSaved ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-ink">
                {AI_PROVIDERS.find((p) => p.id === aiSaved.provider)?.label || aiSaved.provider}
              </p>
              <p className="text-xs text-faint mt-0.5 font-mono">
                {aiSaved.masked}{aiSaved.model ? ` · ${aiSaved.model}` : ""}
              </p>
              <p className="text-xs text-faint mt-1">Your key powers AI chat and word help — free limits no longer apply.</p>
            </div>
            <button onClick={removeAiKey} disabled={savingAi} className="btn-ghost text-xs py-2 px-4">
              {savingAi ? "Removing…" : "Remove key"}
            </button>
          </div>
        ) : (
          <form onSubmit={saveAiKey} className="space-y-3">
            <p className="text-xs text-faint">
              Add your own key to lift the free AI limits. NVIDIA keys are free at build.nvidia.com.
            </p>
            <select
              className="input"
              value={ai.provider}
              onChange={(e) => setAi({ ...ai, provider: e.target.value })}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <input
              type="password"
              className="input"
              placeholder={`API key (${AI_PROVIDERS.find((p) => p.id === ai.provider)?.hint})`}
              value={ai.key}
              onChange={(e) => setAi({ ...ai, key: e.target.value })}
            />
            <input
              className="input"
              placeholder={`Model (optional, default: ${AI_PROVIDERS.find((p) => p.id === ai.provider)?.defaultModel})`}
              value={ai.model}
              onChange={(e) => setAi({ ...ai, model: e.target.value })}
            />
            <Msg msg={aiMsg} />
            <button type="submit" disabled={savingAi || !ai.key.trim()} className="btn-primary">
              {savingAi ? "Saving…" : "Save key"}
            </button>
          </form>
        )}
      </div>
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/settings/page.jsx"
git commit -m "feat: AI API key card in settings (provider, key, model override)"
```

---

### Task 9: Chat UI — free-chats counter + trial-exhausted notice

**Files:**
- Modify: `app/(dashboard)/chat/page.jsx`

- [ ] **Step 1: Import Link**

At the top, after `import { useState, useRef, useEffect } from "react";`:

```js
import Link from "next/link";
```

- [ ] **Step 2: Add state**

After `const [addedCount, setAddedCount] = useState(0);`:

```js
  const [freeLeft, setFreeLeft] = useState(null); // null until a response reveals it (BYOK users never see it)
  const [trialOver, setTrialOver] = useState(false);
```

- [ ] **Step 3: Handle the 429 + read the header in `send()`**

Old error branch:

```js
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Something went wrong. Please try again." }]);
        return;
      }

      const newId = res.headers.get("X-Conversation-Id");
      if (newId) setConversationId(newId);
```

New:

```js
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429 && data.code === "TRIAL_EXHAUSTED") {
          setFreeLeft(0);
          setTrialOver(true);
        }
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Something went wrong. Please try again." }]);
        return;
      }

      const newId = res.headers.get("X-Conversation-Id");
      if (newId) setConversationId(newId);

      const rem = res.headers.get("X-Free-Chats-Remaining");
      if (rem !== null) setFreeLeft(Number(rem));
```

- [ ] **Step 4: Replace the footer hint line**

Old:

```jsx
          <p className="text-[10px] text-faint mt-2 text-center">History saved automatically · Shift+Enter for new line</p>
```

New:

```jsx
          {trialOver ? (
            <p className="text-[10px] text-faint mt-2 text-center">
              You&apos;ve used all your free AI chats ·{" "}
              <Link href="/settings" className="text-accent font-semibold hover:underline">Add your own API key in Settings</Link>
            </p>
          ) : (
            <p className="text-[10px] text-faint mt-2 text-center">
              History saved automatically · Shift+Enter for new line
              {freeLeft !== null && <> · {freeLeft} free chats left</>}
            </p>
          )}
```

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/chat/page.jsx"
git commit -m "feat: free-chats counter and trial-exhausted notice in chat UI"
```

---

### Task 10: Full verification

**Files:** none created — temporary edits to `lib/quota.js` are reverted before the final commit.

- [ ] **Step 1: Lint + production build**

Run: `npm run lint` → `✔ No ESLint warnings or errors`
Run: `npm run build` → `✓ Generating static pages (27/27)`, exit 0. ("Dynamic server usage" messages for API routes are benign.)

- [ ] **Step 2: Manual pass — quotas** (requires `.env.local` and a running Atlas cluster)

Temporarily edit `lib/quota.js`: `chat: 2, helper: 2, ip: 200`. Run `npm run dev`, log in, then:
1. Send 2 chat messages → footer shows "1 free chats left" then "0 free chats left".
2. Send a 3rd → assistant bubble shows the "used all 50 free AI chats" message (the constant text says 50; only the enforcement number was lowered) and the footer swaps to the Settings link.
3. On a word card, use AI help 3× (different words — the card caches per word) → 3rd shows the word-helps message.

- [ ] **Step 3: Manual pass — BYOK**

1. In Settings, pick NVIDIA, paste a wrong-prefix key (`sk-test1234567890`) → inline error "NVIDIA NIM keys start with "nvapi-"".
2. Paste your real `nvapi-` key → card flips to masked display (`nva••••xxxx`).
3. Chat again → works past the exhausted trial, no counter in the footer, `aiChatsUsed` unchanged in Atlas.
4. Remove the key → next chat message is blocked again (trial still exhausted).
5. Save a garbage-but-well-formed key (`nvapi-` + 20 random chars) → chat shows "Your NVIDIA NIM API key was rejected. Check it in Settings."

- [ ] **Step 4: Manual pass — input limits**

Paste a >2,000-character message → assistant bubble shows "Message is too long (max 2,000 characters)."

- [ ] **Step 5: Restore `lib/quota.js` constants** (`chat: 50, helper: 50, ip: 200`)

Run: `git diff lib/quota.js` → no output (file restored exactly).

- [ ] **Step 6: Final lint + build + commit anything outstanding**

Run: `npm run lint` and `npm run build` once more after the revert. Both clean → done; all commits already made per task.
