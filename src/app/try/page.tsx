'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, Loader2, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'mochi_try_chat';

function loadSaved(): { messages: ChatMsg[]; readyToAnalyze: boolean; result: Record<string, unknown> | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.messages)) return parsed;
  } catch { /* ignore */ }
  return null;
}

function saveState(messages: ChatMsg[], readyToAnalyze: boolean, result: Record<string, unknown> | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, readyToAnalyze, result }));
  } catch { /* ignore */ }
}

export default function TryPage() {
  const saved = useRef(loadSaved());
  const [messages, setMessages] = useState<ChatMsg[]>(saved.current?.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [readyToAnalyze, setReadyToAnalyze] = useState(saved.current?.readyToAnalyze || false);
  const [result, setResult] = useState<Record<string, unknown> | null>(saved.current?.result || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    if (messages.length > 0) saveState(messages, readyToAnalyze, result);
  }, [messages, readyToAnalyze, result]);

  // Initial greeting
  useEffect(() => {
    if (messages.length > 0) return;
    let cancelled = false;

    async function greet() {
      setLoading(true);
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'chat',
            messages: [{ role: 'user', content: '你好，我想試試看 Mochi' }],
          }),
        });
        const data = await res.json();
        if (!cancelled && data.reply) {
          setMessages([{ role: 'assistant', content: data.reply }]);
        }
      } catch {
        if (!cancelled) {
          setMessages([{
            role: 'assistant',
            content: '嗨！我是小默 ✨ 歡迎體驗 Mochi！我想先跟你聊聊天，了解一下你是什麼樣的人～\n\n先跟我說說，你平常最喜歡做什麼？',
          }]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    greet();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    const userMsg: ChatMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: updated }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.readyToAnalyze) setReadyToAnalyze(true);
      } else {
        setError('小默暫時無法回覆，請再試一次');
      }
    } catch {
      setError('網路不穩，請再試一次');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);

  const finishChat = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', messages }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      if (data.personality) {
        const p = data.personality;
        const pp = p.personality_profile || {};
        const sf = p.scoring_features || {};
        setResult({
          bio: p.bio || '',
          traits: pp.traits || p.traits || [],
          values: pp.values || p.values || [],
          datingStyle: p.dating_style || '',
          communicationStyle: p.communication_style || p.communicationStyle || '',
          relationshipGoal: p.relationship_goal || p.relationshipGoal || '',
          redFlags: p.red_flags || [],
          tags: p.tags || [],
          attachmentStyle: sf.attachmentStyle || '',
          conflictStyle: sf.conflictStyle || '',
          loveLanguage: sf.loveLanguage || '',
          lifePace: sf.lifePace || '',
        });
      } else {
        setError('分析失敗，請再試一次');
      }
    } catch {
      setError('網路不穩，請再試一次');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, messages]);

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setReadyToAnalyze(false);
    setResult(null);
    setError('');
  };

  // Analyzing state
  if (analyzing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="animate-float">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
            <Sparkles size={36} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">正在分析你的個性 ✨</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>根據我們的聊天，生成你的專屬檔案...</p>
      </div>
    );
  }

  // Result state
  if (result) {
    const tags = result.tags as string[] || [];
    const traits = result.traits as Array<{ name: string; score: number }> || [];
    const redFlags = result.redFlags as string[] || [];

    return (
      <div className="min-h-dvh px-5 py-8" style={{ background: 'var(--bg)' }}>
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">你的個性檔案</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>由小默根據聊天分析生成</p>
          </div>

          {/* Bio */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>✏️ 自我介紹</p>
            <p className="text-[15px] leading-relaxed">{result.bio as string}</p>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)' }}>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>🏷️ 快速標籤</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'var(--bg-input)', color: 'var(--primary-dark)' }}>
                    {t.startsWith('#') ? t : `#${t}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personality Traits */}
          {traits.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)' }}>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>🧠 人格特質</p>
              <div className="space-y-2.5">
                {traits.map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{t.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{t.score}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                      <div className="h-full rounded-full" style={{ width: `${t.score}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="rounded-2xl p-4 mb-4 space-y-3" style={{ background: 'var(--bg-card)' }}>
            {String(result.datingStyle || '') && (
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>💕 交往風格</p>
                <p className="text-sm mt-0.5">{String(result.datingStyle)}</p>
              </div>
            )}
            {String(result.communicationStyle || '') && (
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>💬 溝通方式</p>
                <p className="text-sm mt-0.5">{String(result.communicationStyle)}</p>
              </div>
            )}
            {String(result.relationshipGoal || '') && (
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>🎯 關係期待</p>
                <p className="text-sm mt-0.5">{String(result.relationshipGoal)}</p>
              </div>
            )}
            {String(result.attachmentStyle || '') && (
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>🔗 依附風格</p>
                <p className="text-sm mt-0.5">{String(result.attachmentStyle)}</p>
              </div>
            )}
            {String(result.loveLanguage || '') && (
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>❤️ 愛的語言</p>
                <p className="text-sm mt-0.5">{String(result.loveLanguage)}</p>
              </div>
            )}
          </div>

          {/* Red flags */}
          {redFlags.length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>🚩 在意的地雷</p>
              <div className="flex flex-wrap gap-2">
                {redFlags.map((f, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: '#FFF0F0', color: 'var(--danger)' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 space-y-3">
            <Link href="/" className="block">
              <button className="w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
                <Heart size={18} />
                註冊 Mochi，開始配對
                <ArrowRight size={16} />
              </button>
            </Link>
            <button onClick={restart} className="w-full py-3 rounded-2xl text-sm font-medium" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>
              重新聊一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat state
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">體驗 Mochi 默契</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>跟小默聊聊天，看看你的個性檔案</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: readyToAnalyze ? '100%' : `${Math.min(userMessageCount * 15, 90)}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
          {readyToAnalyze ? '✅ 可以生成你的個性檔案了！' : `聊幾句就好，不用註冊 (${userMessageCount}/6)`}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : ''}`}
              style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #FF8C6B, #FF6B8A)'
                  : 'var(--bg-card)',
                borderBottomRightRadius: msg.role === 'user' ? '6px' : undefined,
                borderBottomLeftRadius: msg.role !== 'user' ? '6px' : undefined,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 text-sm" style={{ background: 'var(--bg-card)', borderBottomLeftRadius: '6px' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-secondary)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2">
          <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-6 pt-2">
        {readyToAnalyze && (
          <button
            className="w-full py-3 rounded-2xl text-white font-semibold mb-3 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}
            onClick={finishChat}
          >
            <Sparkles size={16} />
            看看我的個性檔案 ✨
          </button>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 h-11 px-4 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text)' }}
            placeholder="說點什麼..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendMessage(); }}
            disabled={loading}
            maxLength={500}
            autoComplete="off"
          />
          <button
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
