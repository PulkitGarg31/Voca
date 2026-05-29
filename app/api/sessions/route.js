import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import PracticeSession from "@/models/PracticeSession";
import User from "@/models/User";
import { rateLimited } from "@/lib/rateLimit";

const TYPES = ["flashcard", "quiz", "spelling"];

// POST /api/sessions — record a completed practice session
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = rateLimited(`sessions:${session.user.id}`, { limit: 30, windowMs: 60_000 });
    if (limited) return limited;

    const body = await req.json();
    const type = TYPES.includes(body.type) ? body.type : "flashcard";
    // Bound all client-supplied values so stats can't be inflated by a bad client.
    const wordsReviewed = (Array.isArray(body.wordsReviewed) ? body.wordsReviewed : []).slice(0, 500);
    const wordsCount = Math.max(0, Math.min(500, Number(body.wordsCount) || wordsReviewed.length));
    const correctCount = Math.max(0, Math.min(wordsCount, Number(body.correctCount) || 0));
    // Duration is in seconds; clamp to a sane range (0–3h).
    const duration = Math.max(0, Math.min(10800, Number(body.duration) || 0));

    if (wordsCount <= 0) {
      return NextResponse.json({ error: "An empty session can't be saved" }, { status: 400 });
    }

    await connectDB();

    // Reject stale sessions whose user no longer exists (deleted account).
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const created = await PracticeSession.create({
      userId: session.user.id,
      type,
      wordsReviewed,
      wordsCount,
      correctCount,
      duration,
    });

    // Update aggregate user stats + streak (practice counts as activity).
    user.stats.totalPracticeSessions += 1;
    user.stats.totalTimeSpent += duration;
    user.updateStreak();
    await user.save();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Session POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
