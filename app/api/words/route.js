import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Word from "@/models/Word";
import User from "@/models/User";

const CATEGORIES = ["Academic", "Business", "Literature", "Science", "Daily Use", "Other"];

const SORTS = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  az: { word: 1 },
  za: { word: -1 },
  mastery_low: { masteryLevel: 1, createdAt: -1 },
  mastery_high: { masteryLevel: -1, createdAt: -1 },
};

// Escape user input before using it as a regex source (prevents ReDoS / regex injection)
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/words — list the logged-in user's words.
// Supports: ?category= ?search= ?favorite=true ?due=true ?mastery=struggling|mastered
//           ?sort=recent|oldest|az|za|mastery_low|mastery_high  ?limit= ?skip=
// Always returns an array; total match count is in the X-Total-Count header.
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const favorite = searchParams.get("favorite");
    const due = searchParams.get("due");
    const mastery = searchParams.get("mastery");
    const sort = SORTS[searchParams.get("sort")] || SORTS.recent;
    const limit = Math.min(200, Math.max(0, Number(searchParams.get("limit")) || 0)); // 0 = no limit
    const skip = Math.max(0, Number(searchParams.get("skip")) || 0);

    const query = { userId: session.user.id };
    if (category && category !== "All" && CATEGORIES.includes(category)) query.category = category;
    if (search && typeof search === "string") {
      const safe = escapeRegex(search.trim().slice(0, 100));
      if (safe) query.word = { $regex: safe, $options: "i" };
    }
    if (favorite === "true") query.isFavorite = true;
    if (mastery === "struggling") query.masteryLevel = { $lte: 1 };
    else if (mastery === "mastered") query.masteryLevel = { $gte: 5 };
    if (due === "true") {
      query.$or = [{ nextReview: null }, { nextReview: { $lte: new Date() } }];
    }

    let q = Word.find(query).sort(sort);
    if (limit) q = q.skip(skip).limit(limit);

    const [words, total] = await Promise.all([q, Word.countDocuments(query)]);
    return NextResponse.json(words, { headers: { "X-Total-Count": String(total) } });
  } catch (err) {
    console.error("Words GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/words — add a new word
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const { word, phonetic, audioUrl, meanings, category, notes } = body;

    if (typeof word !== "string" || !word.trim()) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }
    if (category !== undefined && !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Reject stale sessions whose user no longer exists (e.g. deleted account)
    // so we never re-create data under a dead userId.
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const normalized = word.toLowerCase().trim();

    const existing = await Word.findOne({ userId: session.user.id, word: normalized });
    if (existing) {
      return NextResponse.json(
        { error: `"${word.trim()}" is already in your list` },
        { status: 409 }
      );
    }

    const newWord = await Word.create({
      userId: session.user.id,
      word: normalized,
      phonetic: typeof phonetic === "string" ? phonetic : "",
      audioUrl: typeof audioUrl === "string" ? audioUrl : "",
      meanings: Array.isArray(meanings) ? meanings : [],
      category: category || "Other",
      notes: typeof notes === "string" ? notes : "",
    });

    // Update user stats + streak
    user.stats.totalWordsAdded += 1;
    user.updateStreak();
    await user.save();

    return NextResponse.json(newWord, { status: 201 });
  } catch (err) {
    console.error("Words POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
