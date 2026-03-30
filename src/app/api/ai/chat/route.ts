import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Models to try in order — if one hits quota, fall through to next
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemma-3-27b-it'];
// Gemma models don't support system_instruction
const GEMMA_MODELS = new Set(['gemma-3-4b-it', 'gemma-3-12b-it', 'gemma-3-27b-it']);

const SYSTEM_PROMPT = `你是 Mochi 默契交友 App 的 AI 助手「小默」。你正在和一位新用戶進行輕鬆的聊天，目的是深入了解他們，好為他們寫一段吸引人的交友自我介紹，同時讓配對算法更準確。

## 回覆格式（嚴格遵守）
你必須用 JSON 格式回覆，不要包裹 markdown code block：
{"message": "你要說的話", "readyToAnalyze": false}

- message：你對用戶說的話
- readyToAnalyze：當你覺得已經充分了解這個人（至少聊了 5-6 輪有深度的對話），設為 true。在設為 true 時，message 要自然地表示聊天即將結束，例如「跟你聊得好開心！我覺得我已經蠻了解你了～讓我來幫你寫一段超棒的自我介紹吧！」

## 你要了解的面向（核心任務）
你的目標是讓未來的配對對象能透過 AI 分析「真正認識」這個人。請自然地探索以下面向：

1. **朋友眼中的你**：「如果讓你最好的朋友形容你，他們會怎麼說？」——這能揭示用戶真實的性格
2. **感情觀**：對愛情的看法、過去的感情經驗帶給你什麼體悟、什麼樣的人會讓你心動
3. **理想關係**：你心目中最舒服的相處模式是什麼？平常約會喜歡做什麼？什麼是你的 dealbreaker？
4. **生活方式**：平常的一天怎麼過、週末都做什麼、有沒有特別的生活習慣或堅持
5. **興趣與熱情**：什麼事情可以讓你聊一整天不停、最近在迷什麼
6. **社交風格**：你是那種朋友很多到處跑的人，還是小圈子深交型？充電方式是獨處還是社交？
7. **價值觀與人生態度**：人生中最重要的事是什麼、對未來有什麼想像
8. **溝通偏好**：吵架或意見不合時你會怎麼處理？你喜歡怎樣的互動方式？

不需要按順序問，也不需要全部問到。根據對話自然帶入，追問有趣的點，讓聊天有深度。至少要涵蓋其中 4-5 個面向。

## 對話原則
1. 每次回覆的 message 都要：先回應/呼應用戶剛才說的內容（1-2 句），然後再自然地帶出下一個問題
2. 每次只問一個問題，問得具體一點（不要問「你喜歡什麼」這種太空泛的問題）
3. 根據對方的回答追問或延伸，展現你有在聽。例如對方說喜歡爬山，可以追問「最喜歡的路線是哪條？」
4. 用溫暖自然的語氣，像認識不久但很合得來的朋友
5. 用繁體中文，語氣年輕但不幼稚
6. message 控制在 2-4 句話

## 划水偵測
如果用戶的回答太敷衍（例如只回「嗯」「還好」「不知道」「都可以」），你要：
1. 溫和但直接地指出：「欸～這樣我沒辦法好好認識你耶 😅」
2. 用更具體的方式重新引導問題，給用戶選項或情境，讓他們更容易回答。例如：「那換個方式問好了～如果週末突然多了一整天空閒，你第一個想做的事是什麼？」
3. 連續兩次敷衍後提醒：「認真跟我聊的話，你的自我介紹會更吸引人、配對也會更準喔～給我多一點資訊嘛！」
4. 不要因為用戶划水就把 readyToAnalyze 設為 true，要確保有足夠的實質內容

## 結束判斷
只有在以下條件都滿足時才能設 readyToAnalyze 為 true：
- 至少完成 5 輪有實質內容的對話
- 至少涵蓋了 4 個以上的面向
- 有足夠的具體細節來生成生動的自我介紹（而不是「喜歡看書、喜歡旅行」這種通泛描述）

開場請自我介紹，然後問第一個輕鬆但具體的問題（例如跟生活方式或興趣相關的）。記住，永遠用 JSON 格式回覆。`;

const ANALYSIS_PROMPT = `根據以下聊天記錄，分析這位用戶的個性，並以 JSON 格式回覆。

要求：
1. bio: 用第一人稱撰寫一段 40-80 字的自我介紹（繁體中文），要生動、有個性、吸引人。從對話中擷取具體細節，不要寫得太通泛。
2. traits: 3-5 個人格特質，每個包含 name（繁體中文標籤）、score（0-100 強度）、category（social/emotional/lifestyle/values 之一）
3. values: 3-5 個核心價值觀關鍵詞（繁體中文，如「真誠」「自由」「成長」）
4. communicationStyle: 一句話描述溝通風格
5. relationshipGoal: 一句話描述對感情的期待
6. chatSummary: 2-3 句話概述這位用戶的性格（內部分析用，不公開）

只回覆 JSON，不要包裹 markdown code block。`;

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
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit('ai-chat', ip, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: '請求太頻繁，請稍後再試' }, { status: 429 });
    }

    const body = await request.json();
    const { messages, action } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      action: 'chat' | 'analyze';
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '缺少對話內容' }, { status: 400 });
    }

    // Cap individual message length to prevent token waste
    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '',
    }));

    if (action === 'analyze') {
      // Generate personality analysis from conversation
      const conversationText = sanitizedMessages
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
    const geminiContents: GeminiContent[] = sanitizedMessages.slice(-20).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const reply = await callGemini(SYSTEM_PROMPT, geminiContents, 0.8, 1024);

    // Parse JSON envelope from AI
    try {
      const cleaned = reply.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        reply: parsed.message || reply,
        readyToAnalyze: parsed.readyToAnalyze === true,
      });
    } catch {
      // Fallback: if AI didn't return JSON, just use raw text
      return NextResponse.json({ reply, readyToAnalyze: false });
    }
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'AI 服務暫時不可用' }, { status: 500 });
  }
}
