/**
 * Shared Gemini API helper for AI features.
 * Extracted from Mochi's existing chat route pattern to be reusable
 * across recommendation reasons, conversation starters, etc.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemma-3-27b-it'];
const GEMMA_MODELS = new Set(['gemma-3-4b-it', 'gemma-3-12b-it', 'gemma-3-27b-it']);

interface GeminiChatJSONOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Single-turn Gemini call that expects JSON output.
 * Tries models in order, falling back on quota/503 errors.
 */
export async function geminiChatJSON(options: GeminiChatJSONOptions): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    temperature = 0.4,
    maxOutputTokens = 400,
  } = options;

  let lastError = '';

  for (const model of MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const isGemma = GEMMA_MODELS.has(model);

    const contents = isGemma
      ? [
          { role: 'user', parts: [{ text: `[System Instructions]\n${systemPrompt}\n[End Instructions]\n\n${userPrompt}` }] },
        ]
      : [
          { role: 'user', parts: [{ text: userPrompt }] },
        ];

    const body: Record<string, unknown> = {
      contents,
      generationConfig: { temperature, maxOutputTokens },
    };

    if (!isGemma) {
      body.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status === 503) {
        lastError = `${model}: ${res.status}`;
        continue;
      }

      if (!res.ok) {
        lastError = await res.text();
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textPart = parts.filter((p: { thought?: boolean }) => !p.thought).pop();
      let text = textPart?.text?.trim();

      if (text) {
        // Strip markdown code fences if present
        text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        return text;
      }

      lastError = `${model}: empty response`;
    } catch (err) {
      lastError = `${model}: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
  }

  throw new Error(`Gemini call failed: ${lastError}`);
}
