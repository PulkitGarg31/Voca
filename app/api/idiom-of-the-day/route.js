import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Word from "@/models/Word";
import { getIdiomForDate } from "@/lib/idiomOfDay";

// GET /api/idiom-of-the-day — today's curated idiom (with its meaning + example),
// and whether the current user already saved it to their library. Mirrors
// /api/word-of-the-day, but idioms carry their own definition (no dictionary call).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const { idiom, meaning, example } = getIdiomForDate(now);
    const date = now.toISOString().split("T")[0]; // UTC day

    await connectDB();
    const existing = await Word.findOne({
      userId: session.user.id,
      word: idiom.toLowerCase().trim(),
    }).lean();

    return NextResponse.json({
      date,
      idiom,
      meaning,
      example,
      alreadyAdded: Boolean(existing),
    });
  } catch (err) {
    console.error("Idiom-of-the-day error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
