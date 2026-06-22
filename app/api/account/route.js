import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Word from "@/models/Word";
import PracticeSession from "@/models/PracticeSession";
import ChatConversation from "@/models/ChatConversation";
import { deleteHistories } from "@/lib/langchain";

// GET /api/account — current user's profile + preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id).select("name email dailyGoal").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ name: user.name, email: user.email, dailyGoal: user.dailyGoal ?? 10 });
  } catch (err) {
    console.error("Account GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/account — update profile (display name and/or daily goal)
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const update = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      update.name = body.name.trim();
    }
    if (body.dailyGoal !== undefined) {
      const g = Math.round(Number(body.dailyGoal));
      if (!Number.isFinite(g) || g < 1 || g > 200) {
        return NextResponse.json({ error: "Daily goal must be between 1 and 200" }, { status: 400 });
      }
      update.dailyGoal = g;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(session.user.id, { $set: update }, { new: true });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ name: user.name, dailyGoal: user.dailyGoal });
  } catch (err) {
    console.error("Account PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/account — permanently delete the user and all their data
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = session.user.id;

    // Collect this user's conversation ids before deleting the metadata, so we
    // can clear their messages from the separate native-driver collection.
    const convos = await ChatConversation.find({ userId }).select("conversationId").lean();
    const sessionIds = [...new Set([userId, ...convos.map((c) => c.conversationId)])];

    await Promise.all([
      Word.deleteMany({ userId }),
      PracticeSession.deleteMany({ userId }),
      ChatConversation.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    // Chat messages live in a separate native-driver collection.
    try {
      await deleteHistories(sessionIds);
    } catch (e) {
      console.error("Failed to clear chat history on delete:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
