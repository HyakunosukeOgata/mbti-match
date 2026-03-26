/**
 * In-memory sliding-window rate limiter.
 * Each instance tracks a specific action (e.g. "like", "message").
 */

const stores = new Map<string, Map<string, number[]>>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // cleanup every 60s

export function rateLimit(
  action: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  if (!stores.has(action)) stores.set(action, new Map());
  const store = stores.get(action)!;

  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (store.get(key) || []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: oldest + windowMs - now };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  // Periodic cleanup across all stores
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [, s] of stores) {
      for (const [k, v] of s) {
        if (v.every((t) => t <= cutoff)) s.delete(k);
      }
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}
