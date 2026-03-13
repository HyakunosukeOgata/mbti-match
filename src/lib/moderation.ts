/**
 * Content moderation — basic client-side word filter
 * Covers profanity, harassment, hate speech, spam, sexual content
 * For production: should be supplemented with server-side AI moderation
 */

// Sensitive words (partial match patterns)
const BLOCKED_PATTERNS: RegExp[] = [
  // 色情/性暗示
  /約砲|約炮|一夜情|打炮|做愛|性交|裸照|裸體|色情|成人片/,
  /onlyfans|porn|nude|sex\s*chat|hook\s*up/i,
  // 詐騙/金錢
  /匯款|轉帳給我|加line|加賴|加微信|私人帳號|投資.*報酬|穩賺/,
  /bitcoin.*transfer|crypto.*invest|wire.*money/i,
  // 暴力/威脅
  /殺了你|弄死你|去死|找人.*揍你|要你好看/,
  // 歧視/仇恨
  /死gay|死同性戀|死變態|死外勞|死陸客|滾回/,
  // 個資騷擾
  /告訴我.*地址|你住哪.*幾號|你.*身分證/,
];

// Spam patterns
const SPAM_PATTERNS: RegExp[] = [
  /(.)\1{9,}/,             // Same char repeated 10+ times
  /(https?:\/\/\S+){3,}/i, // 3+ URLs in one message
  /line\s*[:：]\s*\S+/i,    // Sharing Line ID
  /ig\s*[:：]\s*@/i,        // Sharing IG handle
];

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if text content passes moderation
 */
export function moderateText(text: string): ModerationResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { allowed: false, reason: '訊息不能為空' };
  }

  if (trimmed.length > 2000) {
    return { allowed: false, reason: '訊息太長（上限 2000 字）' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason: '訊息包含不當內容，請修改後重新發送' };
    }
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason: '訊息疑似垃圾訊息，請修改後重新發送' };
    }
  }

  return { allowed: true };
}

/**
 * Check if a profile bio passes moderation
 */
export function moderateBio(bio: string): ModerationResult {
  const result = moderateText(bio);
  if (!result.allowed) return result;

  if (bio.length > 500) {
    return { allowed: false, reason: '自我介紹上限 500 字' };
  }

  return { allowed: true };
}

/**
 * Check if a username is appropriate
 */
export function moderateName(name: string): ModerationResult {
  const trimmed = name.trim();

  if (trimmed.length < 1 || trimmed.length > 20) {
    return { allowed: false, reason: '名稱需要 1-20 個字' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason: '名稱包含不當內容' };
    }
  }

  return { allowed: true };
}
