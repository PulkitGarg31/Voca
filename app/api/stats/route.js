import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Word from "@/models/Word";
import User from "@/models/User";
import PracticeSession from "@/models/PracticeSession";
import { isDue } from "@/lib/srs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = session.user.id;

    const [user, words, sessions] = await Promise.all([
      User.findById(userId),
      Word.find({ userId }).sort({ createdAt: -1 }),
      PracticeSession.find({ userId }).sort({ date: -1 }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Category breakdown
    const categoryMap = {};
    words.forEach((w) => {
      categoryMap[w.category] = (categoryMap[w.category] || 0) + 1;
    });
    const categories = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Heatmap: activity per day (word added or practiced)
    const activityMap = {};
    words.forEach((w) => {
      const day = w.createdAt.toISOString().split("T")[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    });
    sessions.forEach((s) => {
      const day = s.date.toISOString().split("T")[0];
      activityMap[day] = (activityMap[day] || 0) + (s.wordsCount || 0);
    });

    // Weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyWords = words.filter((w) => w.createdAt >= weekAgo).length;
    const weeklySessions = sessions.filter((s) => s.date >= weekAgo);

    // Recent words (last 5)
    const recentWords = words.slice(0, 5);

    // Today's goal progress (UTC day, consistent with the heatmap)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const addedToday = words.filter((w) => w.createdAt >= todayStart).length;
    const practicedToday = sessions
      .filter((s) => s.date >= todayStart)
      .reduce((a, s) => a + (s.wordsCount || 0), 0);
    const goal = user.dailyGoal || 10;
    const progress = addedToday + practicedToday;

    // Words due for spaced-repetition review right now
    const dueCount = words.filter((w) => isDue(w, now.getTime())).length;

    return NextResponse.json({
      overall: {
        totalWords: words.length,
        streak: user.streak,
        dueCount,
      },
      today: {
        goal,
        progress,
        added: addedToday,
        practiced: practicedToday,
        met: progress >= goal,
      },
      weekly: {
        words: weeklyWords,
        sessions: weeklySessions.length,
        avgWordsPerDay: Math.round((weeklyWords / 7) * 10) / 10,
      },
      categories,
      activityMap,
      recentWords,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
