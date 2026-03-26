/**
 * Enhanced multi-dimensional matching engine.
 * Ported from Kin's 6-dimension scoring system, adapted for Mochi's
 * UserProfile + AIPersonality types.
 *
 * Replaces the simple values(60%) + traits(40%) formula with:
 * - Value fit (0.30)
 * - Trait fit (0.25)
 * - Communication fit (0.15)
 * - Relationship goal fit (0.15)
 * - Preference fit (0.15) — age, gender, region satisfaction
 */

import type { UserProfile } from './types';

// ─── Config ─────────────────────────────────────────────

export const MATCHING_WEIGHTS = {
  valueFit: 0.30,
  traitFit: 0.25,
  communicationFit: 0.15,
  relationshipGoalFit: 0.15,
  preferenceFit: 0.15,
} as const;

export const MAX_RECOMMENDATIONS = 5;
export const MIN_SCORE_THRESHOLD = 10;

// ─── Types ──────────────────────────────────────────────

export interface ScoringBreakdown {
  valueFit: number;            // 0–1
  traitFit: number;            // 0–1
  communicationFit: number;    // 0–1
  relationshipGoalFit: number; // 0–1
  preferenceFit: number;       // 0–1
}

export interface ScoreResult {
  totalScore: number;         // 0–100
  breakdown: ScoringBreakdown;
  matchedSignals: string[];
  cautionSignals: string[];
}

// ─── Utility ────────────────────────────────────────────

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Dimension scorers ──────────────────────────────────

export function scoreValueFit(me: UserProfile, them: UserProfile): number {
  const myValues = me.aiPersonality?.values || [];
  const theirValues = them.aiPersonality?.values || [];
  return jaccard(myValues, theirValues);
}

export function scoreTraitFit(me: UserProfile, them: UserProfile): number {
  const myTraits = me.aiPersonality?.traits || [];
  const theirTraits = them.aiPersonality?.traits || [];

  if (myTraits.length === 0 || theirTraits.length === 0) return 0.5;

  // Name overlap score (Jaccard)
  const nameOverlap = jaccard(
    myTraits.map(t => t.name),
    theirTraits.map(t => t.name),
  );

  // Score-distance for shared-name traits
  let totalDiff = 0;
  let compared = 0;
  for (const myTrait of myTraits) {
    const match = theirTraits.find(t => t.name.toLowerCase() === myTrait.name.toLowerCase());
    if (match) {
      totalDiff += Math.abs(myTrait.score - match.score);
      compared++;
    }
  }
  const distanceScore = compared > 0 ? Math.max(0, 1 - totalDiff / compared / 100) : 0.5;

  // Combine: name overlap 60%, score distance 40%
  return nameOverlap * 0.6 + distanceScore * 0.4;
}

export function scoreCommunicationFit(me: UserProfile, them: UserProfile): number {
  const myStyle = me.aiPersonality?.communicationStyle;
  const theirStyle = them.aiPersonality?.communicationStyle;
  const mySF = me.aiPersonality?.scoringFeatures;
  const theirSF = them.aiPersonality?.scoringFeatures;

  let score = 0.5; // default

  // Use scoringFeatures if available
  if (mySF && theirSF) {
    // Conflict style compatibility
    const conflictCompat: Record<string, string[]> = {
      'confronter': ['collaborator', 'confronter'],
      'avoider': ['avoider', 'compromiser'],
      'collaborator': ['collaborator', 'confronter', 'compromiser'],
      'compromiser': ['collaborator', 'compromiser', 'avoider'],
    };
    const conflictMatch = (conflictCompat[mySF.conflictStyle] || []).includes(theirSF.conflictStyle) ? 0.4 : 0;

    // Social energy similarity (closer = better)
    const energyDiff = Math.abs(mySF.socialEnergy - theirSF.socialEnergy);
    const energyScore = Math.max(0, 1 - energyDiff / 80) * 0.3;

    // Emotional depth compatibility (similar depth)
    const depthDiff = Math.abs(mySF.emotionalDepth - theirSF.emotionalDepth);
    const depthScore = Math.max(0, 1 - depthDiff / 80) * 0.3;

    score = conflictMatch + energyScore + depthScore;
  } else if (myStyle && theirStyle) {
    // Fallback: keyword matching
    if (myStyle === theirStyle) return 1.0;
    const myWords = new Set(myStyle.toLowerCase().split(/[\s，、,]+/).filter(w => w.length > 1));
    const theirWords = new Set(theirStyle.toLowerCase().split(/[\s，、,]+/).filter(w => w.length > 1));
    let shared = 0;
    myWords.forEach(w => { if (theirWords.has(w)) shared++; });
    const total = Math.max(myWords.size, theirWords.size, 1);
    score = Math.max(0.3, shared / total);
  }

  return score;
}

export function scoreRelationshipGoalFit(me: UserProfile, them: UserProfile): number {
  const myGoal = me.aiPersonality?.relationshipGoal;
  const theirGoal = them.aiPersonality?.relationshipGoal;
  const mySF = me.aiPersonality?.scoringFeatures;
  const theirSF = them.aiPersonality?.scoringFeatures;

  let goalScore = 0.5;

  // Use scoringFeatures if available
  if (mySF && theirSF) {
    // Attachment style compatibility
    const attachCompat: Record<string, string[]> = {
      'secure': ['secure', 'anxious', 'avoidant', 'mixed'],
      'anxious': ['secure', 'mixed'],
      'avoidant': ['secure', 'avoidant'],
      'mixed': ['secure', 'mixed'],
    };
    const attachMatch = (attachCompat[mySF.attachmentStyle] || []).includes(theirSF.attachmentStyle) ? 0.4 : 0.1;

    // Life pace similarity
    const paceMap = { slow: 0, moderate: 1, fast: 2 };
    const paceDiff = Math.abs((paceMap[mySF.lifePace] ?? 1) - (paceMap[theirSF.lifePace] ?? 1));
    const paceScore = paceDiff === 0 ? 0.3 : paceDiff === 1 ? 0.15 : 0;

    // Dating style keyword comparison
    const myDS = me.aiPersonality?.datingStyle || '';
    const theirDS = them.aiPersonality?.datingStyle || '';
    const dsWords = new Set(myDS.toLowerCase().split(/[\s，、,]+/).filter(w => w.length > 1));
    const theirDsWords = new Set(theirDS.toLowerCase().split(/[\s，、,]+/).filter(w => w.length > 1));
    let dsShared = 0;
    dsWords.forEach(w => { if (theirDsWords.has(w)) dsShared++; });
    const dsScore = dsWords.size > 0 ? Math.min(0.3, (dsShared / Math.max(dsWords.size, 1)) * 0.3) : 0.15;

    goalScore = attachMatch + paceScore + dsScore;
  } else if (myGoal && theirGoal) {
    // Fallback: keyword matching
    if (myGoal === theirGoal) return 1.0;
    const myWords = new Set(myGoal.toLowerCase().split(/[\s，、,]+/).filter(w => w.length > 1));
    const theirWords = new Set(theirGoal.toLowerCase().split(/[\s，、,]+/).filter(w => w.length > 1));
    let shared = 0;
    myWords.forEach(w => { if (theirWords.has(w)) shared++; });
    const total = Math.max(myWords.size, theirWords.size, 1);
    goalScore = Math.max(0.2, shared / total);
  }

  return goalScore;
}

export function scorePreferenceFit(me: UserProfile, them: UserProfile): number {
  let score = 1.0;
  let factors = 0;

  // Gender preference
  if (me.preferences.genderPreference.length > 0) {
    factors++;
    if (!me.preferences.genderPreference.includes(them.gender)) {
      score -= 0.4; // heavy penalty
    }
  }

  // Age range
  if (me.preferences.ageMin || me.preferences.ageMax) {
    factors++;
    if (them.age < me.preferences.ageMin || them.age > me.preferences.ageMax) {
      score -= 0.3;
    }
  }

  // Region
  if (me.preferences.preferredRegions && me.preferences.preferredRegions.length > 0) {
    factors++;
    if (them.preferences?.region && !me.preferences.preferredRegions.includes(them.preferences.region)) {
      score -= 0.2;
    }
  }

  return factors > 0 ? Math.max(0, score) : 0.5;
}

// ─── Combined score ─────────────────────────────────────

export function scoreMatch(me: UserProfile, them: UserProfile): ScoreResult {
  const breakdown: ScoringBreakdown = {
    valueFit: scoreValueFit(me, them),
    traitFit: scoreTraitFit(me, them),
    communicationFit: scoreCommunicationFit(me, them),
    relationshipGoalFit: scoreRelationshipGoalFit(me, them),
    preferenceFit: scorePreferenceFit(me, them),
  };

  const w = MATCHING_WEIGHTS;
  const raw =
    breakdown.valueFit * w.valueFit +
    breakdown.traitFit * w.traitFit +
    breakdown.communicationFit * w.communicationFit +
    breakdown.relationshipGoalFit * w.relationshipGoalFit +
    breakdown.preferenceFit * w.preferenceFit;

  // Scale to 0–100, with a floor of 35 to avoid discouraging scores
  const totalScore = Math.max(35, Math.min(100, Math.round(raw * 100)));

  // Build human-readable signals
  const matchedSignals: string[] = [];
  const cautionSignals: string[] = [];

  if (breakdown.valueFit >= 0.4) matchedSignals.push("核心價值觀契合");
  if (breakdown.traitFit >= 0.5) matchedSignals.push("特質相似");
  if (breakdown.communicationFit >= 0.6) matchedSignals.push("溝通風格相近");
  if (breakdown.relationshipGoalFit >= 0.7) matchedSignals.push("關係目標一致");
  if (breakdown.preferenceFit >= 0.8) matchedSignals.push("符合偏好條件");

  // Enhanced signals from scoring features
  const mySF = me.aiPersonality?.scoringFeatures;
  const theirSF = them.aiPersonality?.scoringFeatures;
  if (mySF && theirSF) {
    if (mySF.lifePace === theirSF.lifePace) matchedSignals.push("生活節奏一致");
    if (mySF.conflictStyle === theirSF.conflictStyle) matchedSignals.push("衝突處理方式相近");
    if (Math.abs(mySF.socialEnergy - theirSF.socialEnergy) <= 20) matchedSignals.push("社交能量接近");
    if (Math.abs(mySF.socialEnergy - theirSF.socialEnergy) > 50) cautionSignals.push("社交需求差異較大");
  }

  // Red flag cross-check
  const myRedFlags = me.aiPersonality?.redFlags || [];
  const theirRedFlags = them.aiPersonality?.redFlags || [];
  const myTags = (me.aiPersonality?.tags || []).map(t => t.toLowerCase().replace('#', ''));
  const theirTags = (them.aiPersonality?.tags || []).map(t => t.toLowerCase().replace('#', ''));
  // Check if their tags match my red flags (simplified keyword check)
  for (const rf of myRedFlags) {
    const rfLower = rf.toLowerCase();
    if (theirTags.some(t => rfLower.includes(t) || t.includes(rfLower))) {
      cautionSignals.push(`你的地雷可能相關：${rf}`);
    }
  }
  for (const rf of theirRedFlags) {
    const rfLower = rf.toLowerCase();
    if (myTags.some(t => rfLower.includes(t) || t.includes(rfLower))) {
      cautionSignals.push(`對方的地雷可能相關：${rf}`);
    }
  }

  if (breakdown.valueFit < 0.2) cautionSignals.push("價值觀差異較大");
  if (breakdown.relationshipGoalFit < 0.3) cautionSignals.push("關係期待不太一致");
  if (breakdown.communicationFit < 0.3) cautionSignals.push("溝通風格差異較大");

  return { totalScore, breakdown, matchedSignals, cautionSignals };
}

/**
 * Enhanced compatibility calculation — drop-in replacement for the old
 * calculateCompatibility(). Returns 0-100.
 */
export function calculateEnhancedCompatibility(me: UserProfile, them: UserProfile): number {
  return scoreMatch(me, them).totalScore;
}
