import User from "@/models/User";
import AiUsage from "@/models/AiUsage";

// Lifetime free-AI budgets (owner's key only). Raising these constants and
// redeploying is the only reset lever, by design.
export const LIMITS = {
  chat: 50,   // AI chat messages per account
  helper: 50, // word-helper calls per account
  ip: 200,    // all AI calls per client IP
};

// Atomically consume one unit of a per-account budget. `field` is
// "aiChatsUsed" or "aiHelperUsed". Returns { ok, remaining }; ok:false means
// the budget was already exhausted (and nothing was consumed).
export async function lifetimeQuota(userId, field, limit) {
  const updated = await User.findOneAndUpdate(
    { _id: userId, [field]: { $lt: limit } },
    { $inc: { [field]: 1 } },
    { new: true }
  ).select(field);
  if (!updated) return { ok: false, remaining: 0 };
  return { ok: true, remaining: Math.max(0, limit - updated[field]) };
}

// Atomically consume one unit of the per-IP budget. ok:false when over.
export async function ipQuota(ip, limit) {
  const doc = await AiUsage.findOneAndUpdate(
    { key: `ai:ip:${ip}` },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  return { ok: doc.count <= limit };
}
