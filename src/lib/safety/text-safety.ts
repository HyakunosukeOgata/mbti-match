/**
 * Text safety analysis — rule-based content moderation.
 * Ported from Kin — checks user-generated text for blocklist terms,
 * contact info leakage, spam patterns, and length violations.
 */

import { detectContactInfo, type ContactDetectionResult } from "./contact-detection";

// ─── Blocklist ─────────────────────────────────────────

const BLOCKED_TERMS = [
  // Severe slurs / hate (zh)
  "幹你娘", "操你媽", "他媽的", "婊子", "賤人", "白癡", "智障", "廢物", "去死",
  // Explicit sexual solicitation
  "約炮", "一夜情", "開房", "服務加賴", "援交", "色情", "裸照", "性服務",
  // Severe slurs / hate (en)
  "fuck you", "kill yourself", "kys",
];

const BLOCKED_PATTERN = new RegExp(
  BLOCKED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

// ─── Spam patterns ─────────────────────────────────────

const SPAM_PATTERNS = [
  /(.)\1{5,}/,                                // same char repeated 6+ times
  /(?:https?:\/\/[^\s]+\s*){2,}/i,           // multiple URLs
  /(?:加入|加我|免費|限時|優惠|賺錢|投資|被動收入){2,}/,
  /(?:月入|日入)\s*\d+/,
  /(?:賺|入)\s*\d{4,}/,
];

// ─── Types ─────────────────────────────────────────────

export interface TextSafetyFlag {
  type: "empty" | "too_long" | "blocked_term" | "contact_info" | "spam";
  detail: string;
}

export interface TextSafetyResult {
  allowed: boolean;
  flags: TextSafetyFlag[];
  normalizedText: string;
  contactDetection: ContactDetectionResult | null;
}

export interface TextSafetyOptions {
  maxLength?: number;
  minLength?: number;
  blockContactInfo?: boolean;
  fieldName?: string;
}

// ─── Main analysis ─────────────────────────────────────

export function analyzeTextSafety(
  text: string,
  options: TextSafetyOptions = {},
): TextSafetyResult {
  const {
    maxLength = 500,
    minLength = 0,
    blockContactInfo = true,
    fieldName = "文字",
  } = options;

  const flags: TextSafetyFlag[] = [];
  const normalizedText = (text ?? "").replace(/\s+/g, " ").trim();

  if (minLength > 0 && normalizedText.length < minLength) {
    flags.push({ type: "empty", detail: `${fieldName}不能為空` });
  }

  if (normalizedText.length > maxLength) {
    flags.push({ type: "too_long", detail: `${fieldName}不能超過 ${maxLength} 字` });
  }

  if (BLOCKED_PATTERN.test(normalizedText)) {
    flags.push({ type: "blocked_term", detail: `${fieldName}包含不適當的內容` });
  }

  const contactResult = detectContactInfo(normalizedText);
  if (contactResult.hasContact && blockContactInfo) {
    const signalMap: Record<string, string> = {
      email: "電子郵件",
      phone: "電話號碼",
      social_channel: "社交軟體帳號",
      url: "網址連結",
    };
    const items = contactResult.signals.map((s) => signalMap[s] ?? s).join("、");
    flags.push({
      type: "contact_info",
      detail: `為了保護你的隱私，${fieldName}中請勿包含${items}`,
    });
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(normalizedText)) {
      flags.push({ type: "spam", detail: `${fieldName}包含疑似廣告或垃圾訊息的內容` });
      break;
    }
  }

  const blockingTypes = new Set<TextSafetyFlag["type"]>(["blocked_term", "spam"]);
  if (blockContactInfo) blockingTypes.add("contact_info");
  if (minLength > 0) blockingTypes.add("empty");
  blockingTypes.add("too_long");

  const allowed = !flags.some((f) => blockingTypes.has(f.type));

  return {
    allowed,
    flags,
    normalizedText,
    contactDetection: contactResult.hasContact ? contactResult : null,
  };
}

export function getSafetyErrorMessage(result: TextSafetyResult): string | null {
  if (result.allowed) return null;
  return result.flags[0]?.detail ?? "輸入內容不符合規範";
}
