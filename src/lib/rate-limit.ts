/**
 * In-memory sliding-window rate limiter.
 * Each instance tracks a specific action (e.g. "like", "message").
 */

const stores = new Map<string, Map<string, number[]>>();

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

  // Periodic cleanup: remove keys with no recent activity
  if (store.size > 10000) {
    for (const [k, v] of store) {
      if (v.every((t) => t <= cutoff)) store.delete(k);
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}
