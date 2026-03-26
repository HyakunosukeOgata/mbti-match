export const USER_SCOPED_STORAGE_KEYS = [
  'mbti-match-daily',
  'mbti-match-matches',
  'mbti-match-likes',
  'mbti-match-skipped',
  'mochi_notifications',
  'mochi_blocked_users',
  'mochi_blocked_names',
  'mochi_reports',
  'mochi_profile_visible',
  'mochi_hide_age',
] as const;

export function getUserScopedKey(baseKey: string, userId?: string | null) {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function readScopedJSON<T>(baseKey: string, userId: string | null | undefined, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(getUserScopedKey(baseKey, userId));
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeScopedJSON(baseKey: string, userId: string | null | undefined, value: unknown) {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.setItem(getUserScopedKey(baseKey, userId), JSON.stringify(value));
}

export function removeScopedStorage(baseKeys: readonly string[], userId?: string | null) {
  if (typeof window === 'undefined' || !userId) return;
  baseKeys.forEach((baseKey) => localStorage.removeItem(getUserScopedKey(baseKey, userId)));
}

export function removeLegacyStorage(baseKeys: readonly string[]) {
  if (typeof window === 'undefined') return;
  baseKeys.forEach((baseKey) => localStorage.removeItem(baseKey));
}