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
          { error: `You've used all ${LIMITS.helper} free AI word helps. Add your own API key in Settings to keep going.`, code: "HELPER_LIMIT" },
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
        { error: `Your ${byok.label} API key was rejected. Check it in Settings.`, code: "BYOK_REJECTED" },
        { status: 401 }
      );
    }
    if (!byok && (status === 401 || status === 403)) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
