import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { PROVIDERS, MODEL_NAME_RE } from "@/lib/providers";
import { rateLimited } from "@/lib/rateLimit";

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
    if (!key || !PROVIDERS[user.aiProvider]) {
      return NextResponse.json({ provider: null, masked: null, model: "" });
    }
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

    const limited = rateLimited(`api-key:${session.user.id}`, { limit: 10, windowMs: 60_000 });
    if (limited) return limited;

    // Parse the body in isolation: a JSON SyntaxError message can embed raw
    // body fragments (i.e. the key) — never let it reach the outer catch's log.
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    body = body || {};

    const provider = typeof body.provider === "string" ? body.provider : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";

    const p = PROVIDERS[provider];
    if (!p) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    if (apiKey.length < 10 || apiKey.length > 512) {
      return NextResponse.json({ error: "That key doesn't look valid" }, { status: 400 });
    }
    if (!p.keyPrefixes.some((pre) => apiKey.startsWith(pre))) {
      return NextResponse.json(
        { error: `${p.label} keys start with ${p.keyPrefixes.map((x) => `"${x}"`).join(" or ")} — check you picked the right provider` },
        { status: 400 }
      );
    }
    if (model && !MODEL_NAME_RE.test(model)) {
      return NextResponse.json({ error: "Invalid model name" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(session.user.id, {
      aiProvider: provider,
      aiApiKey: encryptSecret(apiKey),
      aiModel: model,
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
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
