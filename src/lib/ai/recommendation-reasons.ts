/**
 * AI-generated recommendation reasons.
 * Ported from Kin — generates human-readable "why you match" explanations
 * using Gemini, adapted for Mochi's UserProfile type.
 */

import { geminiChatJSON } from './gemini';
import { sanitizeRecommendationReasons } from '../safety/ai-output-safety';
import type { UserProfile } from '../types';
import type { ScoringBreakdown } from '@/lib/matching-engine';

// ─── System prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `你是交友產品 Mochi 默契的推薦理由撰寫者（Explainer）。

你的任務：系統已經算出今日推薦對象。你不負責排序，只負責把配對依據寫成人類看得懂的話。

語氣要求：
- 像一位謹慎的朋友在幫你分析，不是行銷文案
- 具體指出兩人之間的共通點或互補之處
- 多用描述行為/偏好的方式，少用抽象形容詞
- 範例好的寫法：
  「你們都偏好穩定、低壓的互動節奏」
  「你重視安全感，對方的溝通風格比較一致」
  「你偏慢熱，對方比較有耐心」
- 範例差的寫法：
  「你們命中注定」「完美契合」「AI 認為」

輸出格式：嚴格 JSON
{
  "reasons": ["...", "..."],
  "caution": "..." 或 null
}

規則：
- reasons 最少 2 條、最多 3 條
- 每條要基於具體的 profile 數據（dating_style、scoring_features、red_flags 等）
- 每條限 80 字以內
- caution 用來提醒可能需要注意的差異，null 如果沒有
- 使用繁體中文
- 不要出現「AI」「系統」「演算法」等字眼`;

// ─── Prompt builders ────────────────────────────────────

function buildProfileSummary(p: UserProfile): string {
  const parts: string[] = [];
  if (p.name) parts.push(`名稱：${p.name}`);
  if (p.occupation) parts.push(`職業：${p.occupation}`);
  if (p.education) parts.push(`學歷：${p.education}`);
  if (p.age) parts.push(`年齡：${p.age}`);
  if (p.preferences?.region) parts.push(`城市：${p.preferences.region}`);
  if (p.aiPersonality?.datingStyle) parts.push(`交往風格：${p.aiPersonality.datingStyle}`);
  if (p.aiPersonality?.relationshipGoal) parts.push(`關係期待：${p.aiPersonality.relationshipGoal}`);
  if (p.aiPersonality?.communicationStyle) parts.push(`溝通風格：${p.aiPersonality.communicationStyle}`);
  const values = p.aiPersonality?.values || [];
  if (values.length > 0) parts.push(`核心價值：${values.slice(0, 6).join("、")}`);
  const traits = p.aiPersonality?.traits || [];
  if (traits.length > 0) parts.push(`人格特質：${traits.map(t => t.name).join("、")}`);
  const redFlags = p.aiPersonality?.redFlags || [];
  if (redFlags.length > 0) parts.push(`地雷：${redFlags.join("、")}`);
  const tags = p.aiPersonality?.tags || [];
  if (tags.length > 0) parts.push(`標籤：${tags.join(" ")}`);
  const sf = p.aiPersonality?.scoringFeatures;
  if (sf) {
    parts.push(`依附風格：${sf.attachmentStyle}`);
    parts.push(`社交能量：${sf.socialEnergy}/100`);
    parts.push(`衝突處理：${sf.conflictStyle}`);
    parts.push(`生活節奏：${sf.lifePace}`);
    if (sf.loveLanguage) parts.push(`愛的語言：${sf.loveLanguage}`);
  }
  if (p.bio) parts.push(`自介：${p.bio.slice(0, 100)}`);
  return parts.join("\n");
}

function buildBreakdownSummary(b: ScoringBreakdown, totalScore: number): string {
  return [
    `總分：${totalScore}/100`,
    `價值觀契合：${Math.round(b.valueFit * 100)}%`,
    `特質相似：${Math.round(b.traitFit * 100)}%`,
    `溝通風格：${Math.round(b.communicationFit * 100)}%`,
    `關係目標：${Math.round(b.relationshipGoalFit * 100)}%`,
    `偏好符合：${Math.round(b.preferenceFit * 100)}%`,
  ].join("\n");
}

export interface RecommendationReasons {
  reasons: string[];
  caution: string | null;
}

interface ReasonPromptInput {
  source: UserProfile;
  target: UserProfile;
  breakdown: ScoringBreakdown;
  totalScore: number;
  matchedSignals: string[];
  cautionSignals: string[];
}

export async function generateRecommendationReasons(
  input: ReasonPromptInput,
): Promise<RecommendationReasons> {
  const sections = [
    "## 使用者檔案",
    buildProfileSummary(input.source),
    "",
    "## 推薦對象檔案",
    buildProfileSummary(input.target),
    "",
    "## 配對評分",
    buildBreakdownSummary(input.breakdown, input.totalScore),
  ];

  if (input.matchedSignals.length > 0) {
    sections.push("", "## 正面訊號", input.matchedSignals.join("、"));
  }
  if (input.cautionSignals.length > 0) {
    sections.push("", "## 注意訊號", input.cautionSignals.join("、"));
  }

  sections.push("", "請根據以上資料，產生推薦理由。回傳嚴格 JSON。");

  try {
    const raw = await geminiChatJSON({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: sections.join("\n"),
      temperature: 0.4,
      maxOutputTokens: 400,
    });

    const parsed = JSON.parse(raw);
    const reasons = Array.isArray(parsed.reasons) ? parsed.reasons : [];
    const caution = typeof parsed.caution === 'string' ? parsed.caution : null;
    return sanitizeRecommendationReasons(reasons, caution);
  } catch {
    return { reasons: ["你們有相似的生活風格和價值觀", "基於雙方的偏好和興趣，可能會有不錯的交流"], caution: null };
  }
}

/**
 * Rule-based fallback when AI is unavailable or for low-priority cards.
 */
export function generateFallbackReasons(
  matchedSignals: string[],
  cautionSignals: string[],
): RecommendationReasons {
  const reasons: string[] = [];

  if (matchedSignals.includes("核心價值觀契合")) reasons.push("你們的核心價值觀有許多重疊");
  if (matchedSignals.includes("特質相似")) reasons.push("你們有相似的人格特質，互動起來會很自然");
  if (matchedSignals.includes("溝通風格相近")) reasons.push("你們的溝通節奏相近，不太容易有落差");
  if (matchedSignals.includes("關係目標一致")) reasons.push("你們對感情的期待方向一致");

  if (reasons.length < 2) {
    reasons.push("你們有相似的生活風格和價值觀");
    reasons.push("基於雙方的偏好和興趣，可能會有不錯的交流");
  }

  const caution = cautionSignals.length > 0
    ? cautionSignals[0]
    : null;

  return { reasons: reasons.slice(0, 3), caution };
}
