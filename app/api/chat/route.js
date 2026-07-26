import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ChatConversation from "@/models/ChatConversation";
import { streamVocaChat, clearChatHistory, loadChatHistory } from "@/lib/langchain";
import { rateLimited, clientIp } from "@/lib/rateLimit";
import User from "@/models/User";
import { resolveByok } from "@/lib/providers";
import { lifetimeQuota, ipQuota, LIMITS } from "@/lib/quota";

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
    if (incomingId && typeof incomingId !== "string") return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });

    const limited = rateLimited(`chat:${userId}`, { limit: 20, windowMs: 60_000 });
    if (limited) return limited;

    await connectDB();

    const user = await User.findById(userId).select("+aiApiKey");
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    byok = resolveByok(user);

    // Continue an owned conversation: validate BEFORE consuming any budget so
    // a stale id can't burn a lifetime credit.
    let convo = null;
    if (incomingId) {
      convo = await ChatConversation.findOne({ userId, conversationId: incomingId });
      if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

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
          { error: `You've used all ${LIMITS.chat} free AI chats. Add your own API key (NVIDIA, OpenAI, Gemini, or Claude) in Settings to keep chatting — NVIDIA keys are free at build.nvidia.com.`, code: "TRIAL_EXHAUSTED" },
          { status: 429 }
        );
      }
      freeRemaining = quota.remaining;
    }

    if (!convo) {
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
    try {
      await convo.save();
    } catch (e) {
      gen.return?.(); // stop the upstream stream; generator's finally persists the partial
      throw e;
    }

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
    if (byok && (status === 401 || status === 403 || (byok.provider === "gemini" && status === 400))) {
      return NextResponse.json(
        { error: `Your ${byok.label} API key was rejected. Check the key (and model, if you set one) in Settings.`, code: "BYOK_REJECTED" },
        { status: 401 }
      );
    }
    if (!byok && (status === 401 || status === 403)) {
      return NextResponse.json({ error: "AI is temporarily unavailable. Please try again later." }, { status: 500 });
    }
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
