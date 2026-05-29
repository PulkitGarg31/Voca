import { NextResponse } from "next/server";

// Simple in-memory fixed-window rate limiter.
// Note: state is per server instance — fine for a single node / dev. For a
// multi-instance serverless deploy, back this with Redis/Upstash later.
const buckets = new Map(); // key -> { count, resetAt }

export function rateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }

  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true };
}

// Helper: returns a 429 NextResponse if over limit, else null.
export function rateLimited(key, opts) {
  const r = rateLimit(key, opts);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "Too many requests — please slow down." },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } }
  );
}

// Best-effort client IP from request headers (proxy-aware).
export function clientIp(req) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
