import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ChatConversation from "@/models/ChatConversation";
import { historyExists } from "@/lib/langchain";

// GET /api/chat/conversations — the current user's recent conversations,
// newest first. Also lazily migrates the pre-existing single-thread history
// (stored under sessionId === userId) into a listable conversation, once.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    await connectDB();

    // One-time migration: register the legacy history (keyed by userId) so it
    // shows up in the list. Atomic upsert ($setOnInsert) is race-safe across
    // concurrent first loads; lastMessageAt is backdated so this old thread
    // sorts below newer conversations.
    if (await historyExists(userId)) {
      await ChatConversation.updateOne(
        { userId, conversationId: userId },
        { $setOnInsert: { userId, conversationId: userId, title: "Earlier chat", lastMessageAt: new Date(0) } },
        { upsert: true }
      );
    }

    const conversations = await ChatConversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .limit(30)
      .select("conversationId title lastMessageAt")
      .lean();

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Conversations list error:", err);
    return NextResponse.json({ conversations: [] });
  }
}
