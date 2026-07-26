import mongoose from "mongoose";

// Lifetime counters not tied to a single user (currently: per-IP AI budget).
// One tiny doc per key; no TTL — these never reset, by design.
const AiUsageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
  },
  { collection: "ai_usages" }
);

export default mongoose.models.AiUsage || mongoose.model("AiUsage", AiUsageSchema);
