import { UserProfile } from './types';
import { scoreMatch, calculateEnhancedCompatibility, type ScoreResult, type ScoringBreakdown } from './matching-engine';

export type { ScoreResult, ScoringBreakdown };

export interface CompatibilityInsight {
  summary: string;
  strengths: string[];
  watchouts: string[];
  starters: string[];
  sharedHighlights: string[];
  matchedSignals: string[];
  cautionSignals: string[];
  breakdown: ScoringBreakdown;
}

/**
 * 計算兩個使用者的配對分數 (0-100)
 * Enhanced: 使用 Kin 的多維度評分引擎
 */
export function calculateCompatibility(me: UserProfile, other: UserProfile): number {
  return calculateEnhancedCompatibility(me, other);
}

/**
 * 取得完整配對分析結果（含分數明細和訊號）
 */
export function getFullScoreResult(me: UserProfile, other: UserProfile): ScoreResult {
  return scoreMatch(me, other);
}

export function getCompatibilityInsight(me: UserProfile, other: UserProfile): CompatibilityInsight {
  const result = scoreMatch(me, other);
  const { totalScore: compatibility, matchedSignals, cautionSignals, breakdown } = result;
  const sharedValues = getSharedValues(me, other);
  const strengths: string[] = [];
  const watchouts: string[] = [];
  const starters: string[] = [];

  // Use engine signals for structured insights
  if (sharedValues.length > 0) {
    strengths.push(`你們都重視「${sharedValues[0]}」，價值觀很接近`);
    if (sharedValues.length > 1) {
      strengths.push(`在「${sharedValues.slice(0, 2).join('」和「')}」上有明顯共鳴`);
    }
  }

  if (matchedSignals.includes("溝通風格相近")) {
    strengths.push('你們的溝通風格相近，聊天容易有同頻感');
  } else if (me.aiPersonality?.communicationStyle && other.aiPersonality?.communicationStyle) {
    strengths.push('你們的溝通風格不同，容易給彼此新的刺激');
  }

  const myTraits = me.aiPersonality?.traits || [];
  const otherTraits = other.aiPersonality?.traits || [];
  const sharedTraitNames = myTraits.filter(t => otherTraits.some(o => o.name === t.name)).map(t => t.name);
  if (sharedTraitNames.length > 0) {
    strengths.push(`你們都有「${sharedTraitNames[0]}」的特質，互動時會很自然`);
  }

  // Watchouts from engine signals
  for (const signal of cautionSignals) {
    watchouts.push(signal);
  }
  if (sharedValues.length === 0 && sharedTraitNames.length === 0 && watchouts.length === 0) {
    watchouts.push('價值觀和特質差異較大，先從生活小事聊起會比較自然');
  }

  if (me.aiPersonality?.values[0]) {
    starters.push(`你覺得「${me.aiPersonality.values[0]}」在感情中具體是什麼樣子？`);
  }
  starters.push('最近哪一種相處節奏會讓你最放鬆？');
  starters.push('如果第一次見面，你會比較想散步聊天還是找個地方坐下來聊？');

  const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 3);
  const uniqueWatchouts = Array.from(new Set(watchouts)).slice(0, 2);
  const uniqueStarters = Array.from(new Set(starters)).slice(0, 3);
  const sharedHighlights = sharedValues.slice(0, 3);

  let summary = '你們有穩定的同頻感，適合先從日常偏好聊起。';
  if (compatibility >= 85) {
    summary = '你們的節奏很容易接上，屬於很適合立刻破冰的一組。';
  } else if (compatibility >= 70) {
    summary = '你們有幾個很強的共鳴點，聊起來通常不會太乾。';
  } else if (compatibility < 55) {
    summary = '這組更適合從差異切入，先交換想法比急著硬聊有效。';
  }

  return {
    summary,
    strengths: uniqueStrengths,
    watchouts: uniqueWatchouts,
    starters: uniqueStarters,
    sharedHighlights,
    matchedSignals,
    cautionSignals,
    breakdown,
  };
}

/**
 * AI 人格向量匹配度計算
 * 基於 traits 重疊度 + values 重疊度
 */
function calculateAIPersonalityMatch(me: UserProfile, other: UserProfile): number {
  const myP = me.aiPersonality;
  const otherP = other.aiPersonality;

  // 如果任一方沒有 AI 人格資料，回傳中等分數
  if (!myP || !otherP) return 50;

  // Values overlap (0-100) — 共同價值觀
  const myValues = new Set(myP.values.map(v => v.toLowerCase()));
  const otherValues = new Set(otherP.values.map(v => v.toLowerCase()));
  const sharedValueCount = [...myValues].filter(v => otherValues.has(v)).length;
  const maxValues = Math.max(myValues.size, otherValues.size, 1);
  const valueScore = (sharedValueCount / maxValues) * 100;

  // Trait similarity (0-100) — 人格特質相似度
  let traitScore = 50; // default when no overlapping categories
  if (myP.traits.length > 0 && otherP.traits.length > 0) {
    let totalDiff = 0;
    let compared = 0;
    for (const myTrait of myP.traits) {
      const match = otherP.traits.find(t => t.name === myTrait.name);
      if (match) {
        totalDiff += Math.abs(myTrait.score - match.score);
        compared++;
      }
    }
    if (compared > 0) {
      traitScore = Math.max(0, 100 - (totalDiff / compared));
    }
  }

  // Combined: values 60%, traits 40%
  return Math.round(valueScore * 0.6 + traitScore * 0.4);
}

/**
 * 基本篩選：年齡、性別偏好、地區
 */
export function passesBasicFilters(me: UserProfile, other: UserProfile): boolean {
  if (!me.preferences.genderPreference.includes(other.gender)) return false;
  if (other.age < me.preferences.ageMin || other.age > me.preferences.ageMax) return false;
  if (me.preferences.preferredRegions && me.preferences.preferredRegions.length > 0) {
    if (other.preferences?.region && !me.preferences.preferredRegions.includes(other.preferences.region)) {
      return false;
    }
  }
  return true;
}

/**
 * 取得兩人的共同價值觀
 */
export function getSharedValues(me: UserProfile, other: UserProfile): string[] {
  const myValues = me.aiPersonality?.values || [];
  const otherValues = new Set((other.aiPersonality?.values || []).map(v => v.toLowerCase()));
  return myValues.filter(v => otherValues.has(v.toLowerCase()));
}

const DAILY_EXPOSURE_LIMIT = 10;
const DAILY_MATCH_COUNT = 5;

/**
 * 從候選人中選出今日卡片（配額制）
 */
export function getDailyMatches(
  me: UserProfile,
  candidates: UserProfile[],
  excludeIds: string[] = [],
  exposureCounts: Map<string, number> = new Map()
): UserProfile[] {
  const excludeSet = new Set(excludeIds);
  const eligible = candidates
    .filter(c => c.id !== me.id && c.onboardingComplete && passesBasicFilters(me, c))
    .filter(c => !excludeSet.has(c.id))
    .filter(c => (exposureCounts.get(c.dbId || c.id) || 0) < DAILY_EXPOSURE_LIMIT)
    .map(c => ({
      user: c,
      score: calculateCompatibility(me, c) + (Math.random() * 3)
    }))
    .sort((a, b) => b.score - a.score);

  return eligible.slice(0, DAILY_MATCH_COUNT).map(e => e.user);
}
