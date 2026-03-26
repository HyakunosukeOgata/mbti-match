/**
 * Contact information detection.
 * Ported from Kin — detects phone numbers, email addresses, and social media
 * handles/keywords that indicate attempts to move conversations off-platform.
 */

// ─── Phone patterns ────────────────────────────────────

const PHONE_PATTERNS = [
  /(?:(?:\+?886|0)[\s-]?)?(?:9\d{2}[\s-]?\d{3}[\s-]?\d{3})/,    // Taiwan mobile: 09xx-xxx-xxx
  /(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/, // general phone
  /\d{4}[\s-]?\d{4}[\s-]?\d{2,4}/,                                 // 8-12 digit sequences
];

// ─── Email pattern ─────────────────────────────────────

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// ─── Social media / external channel keywords ──────────

const SOCIAL_KEYWORDS = [
  "line", "line id", "lineid", "加line", "加我line",
  "instagram", "ig", "加ig",
  "telegram", "tg",
  "wechat", "微信",
  "whatsapp", "signal", "discord",
  "facebook", "fb", "messenger",
  "snapchat", "twitter", "threads",
  "加我好友", "私訊我", "私我",
  "站外聊", "站外", "外面聊", "加好友",
  "id是", "id：", "帳號是", "帳號：",
];

const SOCIAL_PATTERN = new RegExp(
  SOCIAL_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

// ─── URL pattern ───────────────────────────────────────

const URL_PATTERN = /https?:\/\/[^\s]+/i;

// ─── Public API ────────────────────────────────────────

export interface ContactDetectionResult {
  hasContact: boolean;
  signals: string[];
}

export function detectContactInfo(text: string): ContactDetectionResult {
  const signals: string[] = [];

  if (!text || text.trim().length === 0) {
    return { hasContact: false, signals };
  }

  const normalized = text.replace(/\s+/g, " ").trim();

  if (EMAIL_PATTERN.test(normalized)) {
    signals.push("email");
  }

  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(normalized)) {
      signals.push("phone");
      break;
    }
  }

  if (SOCIAL_PATTERN.test(normalized)) {
    signals.push("social_channel");
  }

  if (URL_PATTERN.test(normalized)) {
    signals.push("url");
  }

  return {
    hasContact: signals.length > 0,
    signals,
  };
}
