import { NextResponse } from "next/server";

/**
 * Fixed-window rate limiting, held in process memory.
 *
 * Jiffy self-hosts as a single container, so a local Map is the right size of
 * solution — no Redis, no shared state. The point is to stop anyone who can
 * reach the port from burning the operator's provider quota, not to coordinate
 * a fleet.
 */

const WINDOW_MS = 60 * 1000;

// Bounds memory if a caller rotates X-Forwarded-For to mint fresh buckets.
const MAX_TRACKED_KEYS = 10_000;

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

function requestsPerMinute(): number {
  const raw = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60);
  return Number.isFinite(raw) && raw >= 0 ? raw : 60;
}

/**
 * Forwarding headers are trusted only when the operator confirms a reverse
 * proxy sets them — otherwise a direct caller could spoof them and skip the
 * limit entirely. With no proxy, everyone shares one bucket, which still caps
 * total upstream calls.
 */
function clientKey(request: Request): string {
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }
  return "shared";
}

function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }
  // Still full of live windows — drop the oldest to stay bounded.
  if (windows.size >= MAX_TRACKED_KEYS) {
    const oldest = windows.keys().next().value;
    if (oldest !== undefined) windows.delete(oldest);
  }
}

/**
 * Returns a 429 to return from the route, or null when the request may proceed.
 */
export function enforceRateLimit(request: Request): NextResponse | null {
  const limit = requestsPerMinute();
  if (limit === 0) return null; // explicitly disabled

  const now = Date.now();
  const key = clientKey(request);
  const window = windows.get(key);

  if (!window || now >= window.resetAt) {
    if (windows.size >= MAX_TRACKED_KEYS) sweep(now);
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  window.count++;
  if (window.count <= limit) return null;

  const retryAfter = Math.ceil((window.resetAt - now) / 1000);
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "Cache-Control": "no-store",
      },
    }
  );
}
