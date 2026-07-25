import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ChatConversation from "@/models/ChatConversation";
import { streamVocaChat, clearChatHistory, loadChatHistory } from "@/lib/langchain";
import { rateLimited } from "@/lib/rateLimit";

// A short title derived from the first user message.
function deriveTitle(msg) {
  const t = String(msg).trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48).trimEnd()}…` : t || "New chat";
}

// GET /api/chat?conversationId=xxx — load a conversation's messages (must own it).
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversationId = new URL(req.url).searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ history: [] });

    await connectDB();
    const convo = await ChatConversation.findOne({ userId: session.user.id, conversationId }).lean();
    if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const history = await loadChatHistory(conversationId, 50);
    return NextResponse.json({ history, conversationId, title: convo.title });
  } catch (err) {
    console.error("Load history error:", err);
    return NextResponse.json({ history: [] });
  }
}

// POST /api/chat — send a message. Creates a new conversation when no
// conversationId is supplied; otherwise continues an owned one. The reply is
// STREAMED as plain-text chunks (not JSON); the conversation id travels in the
// `X-Conversation-Id` response header. Errors before the first token still
// return JSON with a proper status code.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { message, conversationId: incomingId } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const limited = rateLimited(`chat:${userId}`, { limit: 20, windowMs: 60_000 });
    if (limited) return limited;

    await connectDB();

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
    const gen = streamVocaChat(message, convo.conversationId);
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Conversation-Id": convo.conversationId,
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err.message || "AI response failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat?conversationId=xxx — delete a single owned conversation.
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversationId = new URL(req.url).searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ error: "conversationId is required" }, { status: 400 });

    await connectDB();
    const deleted = await ChatConversation.findOneAndDelete({ userId: session.user.id, conversationId });
    if (!deleted) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    await clearChatHistory(conversationId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chat delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
