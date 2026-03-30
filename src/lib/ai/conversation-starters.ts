/**
 * AI-generated conversation starters.
 * Ported from Kin — generates personalized opening lines for matched pairs
 * using Gemini, adapted for Mochi's UserProfile type.
 */

import { geminiChatJSON } from './gemini';
import { sanitizeConversationStarters } from '../safety/ai-output-safety';
import type { UserProfile } from '../types';

// ─── System prompt ──────────────────────────────────────

const SYSTEM_PROMPT = `你是交友產品 Mochi 默契的 opening coach。

任務：根據兩位使用者的結構化檔案，生成 3 個自然、可直接使用的開場方向。

語氣要求：
- 自然、真實、低壓力
- 像使用者真的可能發出去的第一句話
- 不要油膩、不要曖昧、不要甜膩
- 不要罐頭問句（例如「平常喜歡做什麼」「最近還好嗎」）
- 不要加編號前綴、不要加引號
- 不要出現「你可以試著說」「建議你這樣開場」等解說文字
- 優先利用雙方共同點、共同興趣、生活重疊
- 若資訊不足，生成安全、簡短、自然的開場句
- 三條之間要有差異，不要模板感

輸出格式：嚴格 JSON
{
  "starters": ["...", "...", "..."]
}

規則：
- 一定要 3 條
- 每條不超過 90 字
- 使用繁體中文
- 不要出現「AI」「系統」等字眼`;

// ─── Prompt builder ─────────────────────────────────────

function buildProfileBrief(label: string, p: UserProfile): string {
  const lines: string[] = [`## ${label}`];
  if (p.name) lines.push(`名稱：${p.name}`);
  if (p.occupation) lines.push(`職業：${p.occupation}`);
  if (p.education) lines.push(`學歷：${p.education}`);
  if (p.age) lines.push(`年齡：${p.age}`);
  if (p.preferences?.region) lines.push(`城市：${p.preferences.region}`);
  if (p.aiPersonality?.relationshipGoal) lines.push(`關係期待：${p.aiPersonality.relationshipGoal}`);
  if (p.aiPersonality?.communicationStyle) lines.push(`溝通風格：${p.aiPersonality.communicationStyle}`);
  const values = p.aiPersonality?.values || [];
  if (values.length > 0) lines.push(`核心價值：${values.slice(0, 6).join("、")}`);
  const traits = p.aiPersonality?.traits || [];
  if (traits.length > 0) lines.push(`人格特質：${traits.map(t => t.name).join("、")}`);
  if (p.bio) lines.push(`自介：${p.bio.slice(0, 100)}`);
  return lines.join("\n");
}

function findShared(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  return a.filter((item) => setB.has(item.toLowerCase().trim()));
}

export async function generateConversationStarters(
  source: UserProfile,
  target: UserProfile,
): Promise<string[]> {
  const sections = [
    buildProfileBrief("發話者", source),
    "",
    buildProfileBrief("對象", target),
  ];

  const sharedValues = findShared(
    source.aiPersonality?.values || [],
    target.aiPersonality?.values || [],
  );
  const sharedTraits = findShared(
    (source.aiPersonality?.traits || []).map(t => t.name),
    (target.aiPersonality?.traits || []).map(t => t.name),
  );

  if (sharedValues.length > 0 || sharedTraits.length > 0) {
    sections.push("", "## 共同點");
    if (sharedValues.length > 0) sections.push(`共同價值：${sharedValues.join("、")}`);
    if (sharedTraits.length > 0) sections.push(`共同特質：${sharedTraits.join("、")}`);
  }

  sections.push("", "請根據以上資料，為發話者生成 3 個自然的開場句。回傳嚴格 JSON。");

  try {
    const raw = await geminiChatJSON({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: sections.join("\n"),
      temperature: 0.6,
      maxOutputTokens: 400,
    });

    const parsed = JSON.parse(raw);
    const starters = Array.isArray(parsed.starters) ? parsed.starters : [];
    return sanitizeConversationStarters(starters);
  } catch {
    return sanitizeConversationStarters([]);
  }
}
