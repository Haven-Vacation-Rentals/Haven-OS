/**
 * Tiny in-memory sliding-window rate limiter.
 *
 * Used by public, unauthenticated endpoints (e.g. the lost-items intake
 * form) to keep a single client from flooding writes. Process-local —
 * good enough for low-traffic intake surfaces. If we ever need cluster-
 * wide enforcement, swap the Map for Redis behind the same signature.
 */

type Entry = { hits: number[] };

const buckets = new Map<string, Entry>();

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  const entry = buckets.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((t) => t > cutoff);

  if (entry.hits.length >= opts.limit) {
    const oldest = entry.hits[0];
    const retryAfterMs = Math.max(0, opts.windowMs - (now - oldest));
    buckets.set(key, entry);
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.hits.push(now);
  buckets.set(key, entry);
  return {
    ok: true,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - entry.hits.length),
    retryAfterSeconds: 0,
  };
}

/** Best-effort client identifier from request headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
