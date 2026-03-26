/**
 * Message-specific safety rules.
 * Ported from Kin — stricter than generic text-safety, specifically targets
 * off-platform contact exchange attempts in messaging context.
 */

// ─── Off-platform solicitation patterns ────────────────

const OFF_PLATFORM_PATTERNS = [
  /加[我]?\s*(line|ig|instagram|telegram|tg|wechat|微信|whatsapp|signal|discord|fb|facebook|messenger|snapchat)/i,
  /我的?\s*(line|ig|instagram|telegram|tg|wechat|微信|whatsapp)\s*(id|帳號|是|：|:)/i,
  /(line|ig|instagram|telegram|tg|wechat|微信|whatsapp)\s*(id|帳號)\s*(是|：|:|=)\s*\S+/i,
  /(去|到|用|換|轉)\s*(line|ig|instagram|telegram|tg|wechat|微信|whatsapp|signal|discord)\s*(聊|談|說|講)/i,
  /(line|ig|instagram|telegram|tg|wechat|微信|whatsapp|signal|discord)\s*(聊|比較方便|比較好聊)/i,
  /@[a-zA-Z0-9_]{3,}/,
  /add me on\s*(line|ig|instagram|telegram|whatsapp|signal|discord|snapchat|facebook)/i,
  /my\s*(line|ig|instagram|telegram|whatsapp)\s*(id|is|:)/i,
  /(?:let'?s?\s*)?(?:talk|chat|move|switch)\s*(?:on|to)\s*(line|ig|instagram|telegram|whatsapp|signal|discord)/i,
];

const MESSAGE_SPAM_PATTERNS = [
  /(.{20,})\1/,  // long substring repeated verbatim
];

// ─── Public API ────────────────────────────────────────

export interface MessageSafetyResult {
  allowed: boolean;
  error: string;
}

export function checkMessageSafety(text: string): MessageSafetyResult {
  const normalized = (text ?? "").replace(/\s+/g, " ").trim();

  for (const pattern of OFF_PLATFORM_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        error: "為了你的安全，請勿在訊息中分享外部通訊軟體帳號或要求轉到站外聊天",
      };
    }
  }

  for (const pattern of MESSAGE_SPAM_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        error: "訊息內容疑似重複或自動產生，請重新輸入",
      };
    }
  }

  return { allowed: true, error: "" };
}
