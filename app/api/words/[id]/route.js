import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Word from "@/models/Word";

const CATEGORIES = ["Academic", "Business", "Literature", "Science", "Daily Use", "Other"];

// Fields a client is allowed to update on a word.
const ALLOWED_PATCH_FIELDS = [
  "category",
  "notes",
  "isFavorite",
  "masteryLevel",
  "practiceCount",
  "correctCount",
  "lastPracticed",
  "nextReview",
  "phonetic",
  "audioUrl",
  "meanings",
];

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

function badId(id) {
  return !id || !mongoose.Types.ObjectId.isValid(id);
}

// GET /api/words/:id — fetch a single word owned by the user
export async function GET(req, { params }) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (badId(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await connectDB();
    const word = await Word.findOne({ _id: params.id, userId: session.user.id });
    if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });

    return NextResponse.json(word);
  } catch (err) {
    console.error("Word GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/words/:id — update whitelisted fields on the user's word
export async function PATCH(req, { params }) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (badId(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const update = {};
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (update.category !== undefined && !CATEGORIES.includes(update.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (update.masteryLevel !== undefined) {
      update.masteryLevel = Math.max(0, Math.min(5, Number(update.masteryLevel) || 0));
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await connectDB();
    const word = await Word.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });

    return NextResponse.json(word);
  } catch (err) {
    console.error("Word PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/words/:id — remove the user's word
export async function DELETE(req, { params }) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (badId(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await connectDB();
    const word = await Word.findOneAndDelete({ _id: params.id, userId: session.user.id });
    if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Word DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
