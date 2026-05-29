import mongoose from "mongoose";

const DefinitionSchema = new mongoose.Schema(
  {
    definition: String,
    example: String,
    synonyms: [String],
    antonyms: [String],
  },
  { _id: false }
);

const MeaningSchema = new mongoose.Schema(
  {
    partOfSpeech: String,
    definitions: [DefinitionSchema],
  },
  { _id: false }
);

const WordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    word: { type: String, required: true, trim: true },
    phonetic: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    meanings: [MeaningSchema],
    category: {
      type: String,
      enum: ["Academic", "Business", "Literature", "Science", "Daily Use", "Other"],
      default: "Other",
    },
    notes: { type: String, default: "" },
    isFavorite: { type: Boolean, default: false },

    // Practice tracking
    masteryLevel: { type: Number, default: 0, min: 0, max: 5 },
    practiceCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    lastPracticed: { type: Date, default: null },
    // Spaced-repetition: when this word is next due for review (null = new/never practiced)
    nextReview: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One word per user
WordSchema.index({ userId: 1, word: 1 }, { unique: true });

// Mastery percentage virtual
WordSchema.virtual("masteryPercent").get(function () {
  if (!this.practiceCount) return 0;
  return Math.round((this.correctCount / this.practiceCount) * 100);
});

export default mongoose.models.Word || mongoose.model("Word", WordSchema);
