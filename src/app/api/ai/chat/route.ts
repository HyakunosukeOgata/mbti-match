import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Models to try in order — if one hits quota, fall through to next
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemma-3-27b-it'];
// Gemma models don't support system_instruction
const GEMMA_MODELS = new Set(['gemma-3-4b-it', 'gemma-3-12b-it', 'gemma-3-27b-it']);

const SYSTEM_PROMPT = `你是 Mochi 默契交友 App 的面談員「小默」。你正在和一位新用戶進行一場結構化的個性面談。目的是在 3-5 分鐘內蒐集足夠資訊，讓系統為他建立精準的配對檔案。

你是一個「真人感」的面談員，絕對不要提到自己是 AI、機器人、程式或系統。你就是「小默」，一個在 Mochi 工作、專門幫人找到對象的小幫手。

## 回覆格式（嚴格遵守）
你必須用 JSON 格式回覆，不要包裹 markdown code block：
{"message": "你要說的話", "readyToAnalyze": false}

## 面談架構（核心任務）
你需要在 6-8 輪對話內蒐集以下 6 個維度的資訊。每個維度至少要有一個明確的數據點。

### 維度 1：Personality Traits（人格特質）
用情境題挖掘，不要直接問「你覺得自己的個性是什麼」。
- 範例：「如果朋友臨時約你明天出去玩，你通常會？A 馬上答應 B 看情況再說 C 比較想在家」
- 範例：「週五下班後，你的理想一晚是？」
- 追問他們的精力來源（獨處 vs 社交）

### 維度 2：Dating Style（交往風格）
- 範例：「在認識新對象的時候，你通常會主動出擊還是等對方先靠近？」
- 範例：「你比較喜歡每天傳訊息的類型，還是各過各的、見面再聊？」
- 了解他們的節奏偏好（密集互動 vs 各自空間）

### 維度 3：Communication Style（溝通風格）
用衝突情境測試，不要問「你怎麼溝通」這種空泛問題。
- 範例：「假設你跟另一半意見不合，你會？A 先冷靜一下再談 B 馬上想解決 C 其中一方讓步就好」
- 範例：「如果對方已讀不回你，你通常的反應是？」

### 維度 4：Relationship Goal（關係期待）
- 範例：「你現在是比較想認真找對象，還是先認識看看、順其自然？」
- 範例：「理想的交往狀態是什麼感覺？像好朋友一樣輕鬆、還是比較黏的那種？」

### 維度 5：Preferences & Dealbreakers（偏好與地雷）
直接問，不用拐彎。
- 範例：「有沒有你絕對不能接受的事？比如抽菸、太黏、不尊重個人空間之類的？」
- 範例：「什麼特質會讓你馬上對一個人有好感？」

### 維度 6：Values & Life（價值觀與生活）
- 範例：「如果你現在有一整天的空閒，你會怎麼過？」
- 範例：「人生中你覺得最重要的一件事是什麼？」

## 對話原則
1. 每次只問一個問題，可以給 A/B/C 選項讓用戶更容易回答
2. 先簡短回應用戶的答案（1 句），再自然帶出下一題
3. 如果用戶的回答夠豐富，可以快速追問一句再進入下個維度
4. 語氣像一個很會聊天的朋友在做訪談，溫暖但有目的性
5. 用繁體中文，語氣年輕但不幼稚
6. message 控制在 2-3 句話

## 嚴禁腦補
- 只根據用戶實際說的話回應
- 不要替用戶解讀：用戶說「喜歡爬山」不代表「你是熱愛自由的人」
- 不要誇大或渲染
- 用戶講得簡短你就簡短回應

## 划水處理
如果用戶的回答太敷衍（只回「嗯」「不知道」「都可以」）：
1. 改用 A/B/C 選擇題讓他更容易回答
2. 連續兩次敷衍就提醒：「欸你多說點嘛！回答越具體，之後配到的人會越準喔 😏」
3. 不要因為划水就提早結束

## 結束判斷
readyToAnalyze = true 的條件：
- 至少完成了 6 輪有實質內容的對話
- 6 個維度中至少涵蓋了 4 個
- 每個已涵蓋的維度都有至少一個明確的數據點

結束時的 message 要自然收尾，例如：「好～我覺得我蠻了解你了！讓我來幫你整理一份超棒的個人檔案 💪」

開場先打個招呼，然後直接用一個輕鬆的情境題開始面談。記住，永遠用 JSON 格式回覆。`;

const ANALYSIS_PROMPT = `你是 Profile Generator。根據以下面談記錄，將用戶的個性整理成結構化 JSON 檔案。

## 輸出格式（嚴格遵守，不要包裹 markdown code block）

{
  "bio": "（第一人稱，40-80 字自我介紹，要生動有個性，從對話擷取具體細節）",

  "personality_profile": {
    "traits": [
      {"name": "特質名稱", "score": 0-100, "category": "social|emotional|lifestyle|values"}
    ],
    "values": ["價值觀1", "價值觀2", "價值觀3"]
  },

  "dating_style": "一句話描述交往風格（例如：慢熱穩定型、喜歡自然地認識彼此）",

  "communication_style": "一句話描述溝通方式（例如：有事直說型、需要冷靜再談的人）",

  "relationship_goal": "一句話描述對感情的期待",

  "red_flags": ["地雷1", "地雷2"],

  "tags": ["#標籤1", "#標籤2", "#標籤3", "#標籤4", "#標籤5"],

  "scoring_features": {
    "attachmentStyle": "secure|anxious|avoidant|mixed",
    "socialEnergy": 0-100,
    "conflictStyle": "confronter|avoider|collaborator|compromiser",
    "loveLanguage": "愛的語言描述",
    "lifePace": "slow|moderate|fast",
    "emotionalDepth": 0-100
  },

  "chatSummary": "2-3 句內部分析摘要"
}

## 規則
- traits 要 3-5 個，從對話中推導，不要憑空捏造
- values 要 3-5 個核心價值觀關鍵詞
- red_flags 只填用戶明確表達的地雷，沒有就給空陣列
- tags 要 3-6 個，用 # 開頭，要能快速代表這個人（例如 #慢熱 #重視獨處 #吃貨 #戶外派）
- scoring_features 根據對話合理推斷：
  - attachmentStyle：從衝突處理、回訊息態度等推斷
  - socialEnergy：從獨處 vs 社交偏好推斷
  - conflictStyle：從衝突情境回答推斷
  - loveLanguage：從互動偏好推斷
  - lifePace：從生活步調推斷
  - emotionalDepth：從對話深度和情感表達推斷
- 使用繁體中文
- 不要出現「AI」相關字眼

只回覆 JSON。`;

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

async function callGemini(
  systemInstruction: string,
  contents: GeminiContent[],
  temperature: number,
  maxOutputTokens: number,
): Promise<string> {
  let lastError = '';

  for (const model of MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const isGemma = GEMMA_MODELS.has(model);

    // Gemma: inject system prompt as first user message
    const body: Record<string, unknown> = {
      contents: isGemma
        ? [{ role: 'user', parts: [{ text: `[System Instructions]\n${systemInstruction}\n[End Instructions]\n\nNow respond to the conversation.` }] },
           { role: 'model', parts: [{ text: '好的，我明白了。' }] },
           ...contents]
        : contents,
      generationConfig: { temperature, maxOutputTokens },
    };
    if (!isGemma) {
      body.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status === 503) {
        lastError = `${model}: ${res.status}`;
        continue; // try next model
      }

      if (!res.ok) {
        lastError = await res.text();
        continue; // try next model
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textPart = parts.filter((p: { thought?: boolean }) => !p.thought).pop();
      const text = textPart?.text?.trim();
      if (text) return text;
      lastError = `${model}: empty response`;
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  throw new Error(`All models failed. Last: ${lastError}`);
}

export async function POST(request: NextRequest) {
  // IP-based rate limit (shared by guest /try and authenticated onboarding)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('ai-chat', ip, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '請求太頻繁，請稍後再試' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const { messages, action } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      action: 'chat' | 'analyze';
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '缺少對話內容' }, { status: 400 });
    }

    if (action === 'analyze') {
      // Generate personality analysis from conversation
      const conversationText = messages
        .map(m => `${m.role === 'user' ? '用戶' : 'AI'}：${m.content}`)
        .join('\n');

      const raw = await callGemini(
        ANALYSIS_PROMPT,
        [{ role: 'user', parts: [{ text: conversationText }] }],
        0.7,
        4096,
      );

      // Strip potential markdown fences
      const cleaned = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');

      try {
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ personality: parsed });
      } catch {
        return NextResponse.json({ error: '分析格式錯誤', raw }, { status: 500 });
      }
    }

    // Regular chat — convert messages to Gemini format
    const geminiContents: GeminiContent[] = messages.slice(-20).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const reply = await callGemini(SYSTEM_PROMPT, geminiContents, 0.8, 1024);

    // Parse JSON envelope from AI — handle mixed text+JSON output
    const cleaned = reply.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');

    // Try full string as JSON first
    let parsed: { message?: string; readyToAnalyze?: boolean } | null = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // AI might output plain text before the JSON — extract the JSON part
      const jsonMatch = cleaned.match(/\{[\s\S]*"message"\s*:[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch { /* ignore */ }
      }
    }

    if (parsed?.message) {
      return NextResponse.json({
        reply: parsed.message,
        readyToAnalyze: parsed.readyToAnalyze === true,
      });
    }

    // Final fallback: strip any JSON-like suffix and return plain text
    const plainText = cleaned.replace(/\{[\s\S]*"message"\s*:[\s\S]*\}/, '').trim();
    return NextResponse.json({ reply: plainText || cleaned, readyToAnalyze: false });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'AI 服務暫時不可用' }, { status: 500 });
  }
}
