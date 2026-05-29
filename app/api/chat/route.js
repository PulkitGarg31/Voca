import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runVocaChat, clearChatHistory, loadChatHistory } from "@/lib/langchain";
import { rateLimited } from "@/lib/rateLimit";

// GET /api/chat — load persisted history for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const history = await loadChatHistory(session.user.id, 50);
    return NextResponse.json({ history });
  } catch (err) {
    console.error("Load history error:", err);
    return NextResponse.json({ history: [] });
  }
}

// POST /api/chat — send message or clear history
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, clearHistory } = await req.json();

    if (clearHistory) {
      await clearChatHistory(session.user.id);
      return NextResponse.json({ message: "History cleared" });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const limited = rateLimited(`chat:${session.user.id}`, { limit: 20, windowMs: 60_000 });
    if (limited) return limited;

    const response = await runVocaChat(message, session.user.id);
    return NextResponse.json({ response });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err.message || "AI response failed" },
      { status: 500 }
    );
  }
}
