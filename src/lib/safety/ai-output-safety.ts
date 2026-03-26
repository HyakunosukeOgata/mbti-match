/**
 * AI output safety sanitizer.
 * Ported from Kin — validates AI-generated recommendation reasons and
 * conversation starters before they are stored or shown to users.
 */

import { analyzeTextSafety } from "./text-safety";

function isAITextSafe(text: string, maxLength: number): boolean {
  if (!text || typeof text !== "string") return false;
  const result = analyzeTextSafety(text, {
    maxLength,
    minLength: 1,
    blockContactInfo: true,
    fieldName: "AI output",
  });
  return result.allowed;
}

// ─── Recommendation reasons ────────────────────────────

const FALLBACK_REASONS = [
  "你們有相似的生活風格和價值觀",
  "基於雙方的偏好和興趣，可能會有不錯的交流",
];

export function sanitizeRecommendationReasons(
  reasons: string[],
  caution: string | null,
): { reasons: string[]; caution: string | null } {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return { reasons: FALLBACK_REASONS, caution: null };
  }

  const safeReasons = reasons.filter((r) => isAITextSafe(r, 120));
  if (safeReasons.length < 2) {
    return { reasons: FALLBACK_REASONS, caution: null };
  }

  const safeCaution = caution && isAITextSafe(caution, 120) ? caution : null;
  return { reasons: safeReasons, caution: safeCaution };
}

// ─── Conversation starters ─────────────────────────────

const FALLBACK_STARTERS = [
  "嗨，看了你的檔案覺得蠻有共鳴的，想認識一下。",
  "你最近週末都怎麼過？有沒有特別享受的放鬆方式？",
  "如果這週有一個下午完全自由，你會想做什麼？",
];

export function sanitizeConversationStarters(starters: string[]): string[] {
  if (!Array.isArray(starters) || starters.length === 0) {
    return FALLBACK_STARTERS;
  }

  const safe = starters.filter((s) => isAITextSafe(s, 120));
  if (safe.length < 2) {
    return FALLBACK_STARTERS;
  }

  return safe;
}
