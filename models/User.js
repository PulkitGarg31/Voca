import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false }, // hidden by default
    image: { type: String, default: null },

    // Words to practice/add per day to "hit goal" (drives the dashboard ring)
    dailyGoal: { type: Number, default: 10, min: 1, max: 200 },

    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
      longestStart: { type: Date, default: null },
      longestEnd: { type: Date, default: null },
    },

    stats: {
      totalWordsAdded: { type: Number, default: 0 },
      totalTimeSpent: { type: Number, default: 0 }, // seconds
      totalPracticeSessions: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Update streak logic
UserSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = this.streak.lastActiveDate
    ? new Date(this.streak.lastActiveDate)
    : null;
  if (last) last.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!last || last < yesterday) {
    // Streak broken or first time
    this.streak.current = 1;
  } else if (last.getTime() === yesterday.getTime()) {
    // Consecutive day
    this.streak.current += 1;
  }
  // Same day: do nothing

  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
    // Derive the window start by subtracting days (DST-safe) rather than
    // doing raw millisecond math, which drifts across DST boundaries.
    const start = new Date(today);
    start.setDate(start.getDate() - (this.streak.current - 1));
    this.streak.longestStart = start;
    this.streak.longestEnd = today;
  }

  this.streak.lastActiveDate = today;
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
