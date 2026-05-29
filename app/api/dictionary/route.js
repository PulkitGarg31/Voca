import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchDictionary } from "@/lib/dictionary";
import { rateLimited } from "@/lib/rateLimit";

// GET /api/dictionary?word=ephemeral
// Proxies to the Free Dictionary API and returns a clean response.
// Authenticated only — matches the rest of the API surface.
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimited(`dict:${session.user.id}`, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word")?.trim();

  if (!word) {
    return NextResponse.json({ error: "word parameter is required" }, { status: 400 });
  }
  // A dictionary word is short and alphabetic-ish; reject anything else.
  if (word.length > 50 || !/^[A-Za-z][A-Za-z'\- ]*$/.test(word)) {
    return NextResponse.json({ error: "Please enter a valid word" }, { status: 400 });
  }

  try {
    const result = await fetchDictionary(word);
    if (!result) {
      return NextResponse.json(
        { error: `"${word}" was not found in the dictionary` },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Dictionary fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch dictionary data" }, { status: 500 });
  }
}
