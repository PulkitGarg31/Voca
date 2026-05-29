import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Word from "@/models/Word";
import { fetchDictionary } from "@/lib/dictionary";
import { getWordForDate } from "@/lib/wordOfDay";

// GET /api/word-of-the-day — today's curated word + its definition, and whether
// the current user already has it in their library.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const word = getWordForDate(now);
    const date = now.toISOString().split("T")[0]; // UTC day

    const [details, existing] = await Promise.all([
      fetchDictionary(word).catch(() => null),
      (async () => {
        await connectDB();
        return Word.findOne({ userId: session.user.id, word }).lean();
      })(),
    ]);

    return NextResponse.json({
      date,
      word,
      details, // null if the dictionary lookup failed/missed
      alreadyAdded: Boolean(existing),
    });
  } catch (err) {
    console.error("Word-of-the-day error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
