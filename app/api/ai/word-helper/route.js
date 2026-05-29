import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWordHelp } from "@/lib/langchain";
import { rateLimited } from "@/lib/rateLimit";

// POST /api/ai/word-helper — AI example sentences + mnemonic for a word
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = rateLimited(`ai-helper:${session.user.id}`, { limit: 15, windowMs: 60_000 });
    if (limited) return limited;

    const { word } = await req.json();
    if (typeof word !== "string" || !word.trim() || word.length > 60) {
      return NextResponse.json({ error: "A valid word is required" }, { status: 400 });
    }

    const text = await generateWordHelp(word.trim());
    return NextResponse.json({ text });
  } catch (err) {
    console.error("AI word-helper error:", err);
    return NextResponse.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
