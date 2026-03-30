const VALID_TRAIT_CATEGORIES = new Set(['social', 'emotional', 'lifestyle', 'values']);
const VALID_ATTACHMENT_STYLES = new Set(['secure', 'anxious', 'avoidant', 'mixed']);
const VALID_CONFLICT_STYLES = new Set(['confronter', 'avoider', 'collaborator', 'compromiser']);
const VALID_LIFE_PACES = new Set(['slow', 'moderate', 'fast']);
const LOW_SIGNAL_PATTERNS = ['嗯', '不知道', '都可以', '隨便', '還好', '沒差', '普通', '都行', '看情況'];
const DIMENSION_RULES = [
  { key: 'personality', patterns: ['個性', '精力', '獨處', '社交', '週五', '朋友臨時約', '在家', '出去玩'] },
  { key: 'dating', patterns: ['認識新對象', '主動', '慢慢來', '每天傳訊息', '交往', '節奏'] },
  { key: 'communication', patterns: ['意見不合', '已讀不回', '衝突', '冷靜', '溝通', '吵架'] },
  { key: 'goal', patterns: ['認真找對象', '順其自然', '理想的交往狀態', '關係期待', '長久'] },
  { key: 'preferences', patterns: ['不能接受', '地雷', '好感', '抽菸', '太黏', '尊重個人空間'] },
  { key: 'values', patterns: ['空閒', '人生中最重要', '價值觀', '怎麼過', '生活', '海邊', '煮飯'] },
];

export function stripMarkdownFence(text) {
  return text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '').trim();
}

export function parseJsonObject(raw) {
  const cleaned = stripMarkdownFence(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export function extractChatEnvelope(raw) {
  const direct = parseJsonObject(raw);
  if (direct?.message) return direct;

  const cleaned = stripMarkdownFence(raw);
  const jsonMatch = cleaned.match(/\{[\s\S]*"message"\s*:[\s\S]*\}/);
  if (!jsonMatch) return null;

  return parseJsonObject(jsonMatch[0]);
}

export function normalizeMessages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const role = item.role;
      const content = typeof item.content === 'string' ? item.content.trim() : '';
      if ((role !== 'user' && role !== 'assistant') || !content) return null;
      return { role, content };
    })
    .filter(Boolean)
    .slice(-20);
}

function clampNumber(value, fallback, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeText(value, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeStringArray(value, maxItems, options = {}) {
  if (!Array.isArray(value)) return [];

  const items = value
    .map((item) => normalizeText(item, options.maxLength ?? 24))
    .filter(Boolean)
    .map((item) => (options.prefixHash && !item.startsWith('#') ? `#${item}` : item));

  return [...new Set(items)].slice(0, maxItems);
}

function normalizeTraits(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const name = normalizeText(item.name, 16);
      if (!name) return null;

      return {
        name,
        score: clampNumber(item.score, 60, 0, 100),
        category: VALID_TRAIT_CATEGORIES.has(item.category) ? item.category : 'values',
      };
    })
    .filter(Boolean)
    .slice(0, 5);
}

export function normalizeAnalysis(input) {
  if (!input || typeof input !== 'object') return null;

  const source = input;
  const personalityProfile = source.personality_profile && typeof source.personality_profile === 'object'
    ? source.personality_profile
    : {};
  const scoringFeatures = source.scoring_features && typeof source.scoring_features === 'object'
    ? source.scoring_features
    : {};

  const bio = normalizeText(source.bio, 120);
  const communicationStyle = normalizeText(source.communication_style, 80);
  const relationshipGoal = normalizeText(source.relationship_goal, 80);
  const chatSummary = normalizeText(source.chatSummary, 160);

  if (!bio || !communicationStyle || !relationshipGoal || !chatSummary) return null;

  return {
    bio,
    personality_profile: {
      traits: normalizeTraits(personalityProfile.traits),
      values: normalizeStringArray(personalityProfile.values, 5, { maxLength: 16 }),
    },
    dating_style: normalizeText(source.dating_style, 80),
    communication_style: communicationStyle,
    relationship_goal: relationshipGoal,
    red_flags: normalizeStringArray(source.red_flags, 5, { maxLength: 20 }),
    tags: normalizeStringArray(source.tags, 6, { prefixHash: true, maxLength: 16 }),
    scoring_features: {
      attachmentStyle: VALID_ATTACHMENT_STYLES.has(scoringFeatures.attachmentStyle) ? scoringFeatures.attachmentStyle : 'mixed',
      socialEnergy: clampNumber(scoringFeatures.socialEnergy, 50, 0, 100),
      conflictStyle: VALID_CONFLICT_STYLES.has(scoringFeatures.conflictStyle) ? scoringFeatures.conflictStyle : 'collaborator',
      loveLanguage: normalizeText(scoringFeatures.loveLanguage, 24) || '優質陪伴',
      lifePace: VALID_LIFE_PACES.has(scoringFeatures.lifePace) ? scoringFeatures.lifePace : 'moderate',
      emotionalDepth: clampNumber(scoringFeatures.emotionalDepth, 60, 0, 100),
    },
    chatSummary,
  };
}

function isLowSignalMessage(content) {
  const normalized = content.trim().replace(/[！!。.,，？?～~]/g, '');
  return normalized.length <= 4 || LOW_SIGNAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function evaluateChatReadiness(messages) {
  const userMessages = messages.filter((message) => message.role === 'user');
  const substantialAnswers = userMessages.filter((message) => !isLowSignalMessage(message.content));
  const dimensionHits = new Set();

  for (const message of messages) {
    for (const rule of DIMENSION_RULES) {
      if (rule.patterns.some((pattern) => message.content.includes(pattern))) {
        dimensionHits.add(rule.key);
      }
    }
  }

  return {
    substantialAnswerCount: substantialAnswers.length,
    dimensionCount: dimensionHits.size,
    // Auto-detect: enough substantial answers is sufficient;
    // dimension keyword matching is a bonus signal, not a gate
    isReady: substantialAnswers.length >= 6,
  };
}

export function enforceChatEnvelope(parsed, messages) {
  if (!parsed?.message) return null;

  const readiness = evaluateChatReadiness(messages);
  // Trust AI's readyToAnalyze when user has given enough substantial answers (>=5).
  // This prevents blocking when AI uses different wording than DIMENSION_RULES keywords.
  const hasEnoughContent = readiness.substantialAnswerCount >= 5;
  return {
    message: parsed.message,
    readyToAnalyze: parsed.readyToAnalyze === true && hasEnoughContent,
  };
}

export function normalizeGeneratedBio(input) {
  const source = typeof input === 'object' && input ? input.bio : input;
  return normalizeText(source, 140);
}
