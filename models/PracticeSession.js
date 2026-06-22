import mongoose from "mongoose";

const PracticeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["flashcard", "quiz", "spelling", "pronunciation"],
      required: true,
    },
    wordsReviewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Word" }],
    wordsCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // seconds
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PracticeSession ||
  mongoose.model("PracticeSession", PracticeSessionSchema);
