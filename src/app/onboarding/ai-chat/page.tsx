'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_STORAGE_KEY = 'mochi_onboarding_chat';

function loadSavedChat(): { messages: ChatMsg[]; readyToAnalyze: boolean } | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.messages) && parsed.messages.length > 0) return parsed;
  } catch { /* ignore */ }
  return null;
}

function saveChatToStorage(messages: ChatMsg[], readyToAnalyze: boolean) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, readyToAnalyze }));
  } catch { /* ignore */ }
}

export default function AIOnboardingChatPage() {
  const { currentUser, authReady, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();

  const saved = useRef(loadSavedChat());
  const [messages, setMessages] = useState<ChatMsg[]>(saved.current?.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [startTime] = useState(Date.now());
  const [error, setError] = useState('');
  const [readyToAnalyze, setReadyToAnalyze] = useState(saved.current?.readyToAnalyze || false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  // Persist chat to localStorage on every change
  useEffect(() => {
    if (messages.length > 0) saveChatToStorage(messages, readyToAnalyze);
  }, [messages, readyToAnalyze]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
    }
  }, [authReady, currentUser, router]);

  // Get initial AI greeting
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
            messages: [{ role: 'user', content: '你好，我剛加入 Mochi' }],
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
            content: '嗨！我是小默 ✨ 歡迎來到 Mochi！在開始配對之前，我想先跟你聊聊天，好幫你寫一段超棒的自我介紹。放輕鬆，就像跟朋友聊天一樣～\n\n先跟我說說，你平常最喜歡做什麼？',
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
        if (data.readyToAnalyze) {
          setReadyToAnalyze(true);
        }
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
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        track('ai_chat_complete', { messageCount: userMessageCount, seconds: elapsed });

        const p = data.personality;
        const pp = p.personality_profile || {};
        const sf = p.scoring_features || {};

        await updateProfile({
          aiPersonality: {
            bio: p.bio || '',
            traits: pp.traits || p.traits || [],
            values: pp.values || p.values || [],
            datingStyle: p.dating_style || '',
            communicationStyle: p.communication_style || p.communicationStyle || '',
            relationshipGoal: p.relationship_goal || p.relationshipGoal || '',
            redFlags: p.red_flags || [],
            tags: p.tags || [],
            scoringFeatures: {
              attachmentStyle: sf.attachmentStyle || 'mixed',
              socialEnergy: sf.socialEnergy ?? 50,
              conflictStyle: sf.conflictStyle || 'collaborator',
              loveLanguage: sf.loveLanguage || '',
              lifePace: sf.lifePace || 'moderate',
              emotionalDepth: sf.emotionalDepth ?? 50,
            },
            chatSummary: p.chatSummary || '',
            analyzedAt: new Date().toISOString(),
          },
        });

        setOnboardingStep(3);
        try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* ignore */ }
        router.push('/personality');
      } else {
        setError('分析失敗，請再試一次');
      }
    } catch {
      setError('網路不穩，請再試一次');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, messages, startTime, userMessageCount, updateProfile, currentUser?.bio, setOnboardingStep, router]);

  if (!authReady || !currentUser) return null;

  if (analyzing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <div className="animate-float">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
            <Sparkles size={36} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 animate-fade-in">正在分析你的個性 ✨</h2>
        <p className="text-text-secondary text-sm text-center animate-fade-in">
          正在根據我們的聊天生成你的專屬介紹...
        </p>
        <div className="mt-6 w-48">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: '70%', transition: 'width 3s ease' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-text-secondary">💬 步驟 2/4 · 聊聊天</p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: readyToAnalyze ? '50%' : `${25 + Math.min(userMessageCount * 3, 25)}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {readyToAnalyze
            ? '✅ 小默已經了解你了！點下方按鈕完成分析'
            : '跟小默聊聊天，讓我們更了解你'}
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'text-text-primary'
              }`}
              style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #FF8C6B, #FF6B8A)'
                  : 'var(--bg-secondary)',
                borderBottomRightRadius: msg.role === 'user' ? '6px' : undefined,
                borderBottomLeftRadius: msg.role !== 'user' ? '6px' : undefined,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="rounded-2xl px-4 py-2.5 text-sm" style={{ background: 'var(--bg-secondary)', borderBottomLeftRadius: '6px' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2">
          <p className="text-xs text-danger text-center">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-6 pt-2">
        {readyToAnalyze && (
          <button
            className="btn-primary mb-3 flex items-center justify-center gap-2"
            onClick={finishChat}
            disabled={analyzing}
          >
            <Sparkles size={16} />
            完成聊天，生成我的介紹 ✨
          </button>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="input flex-1"
            placeholder="說點什麼..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendMessage(); }}
            disabled={loading}
            maxLength={500}
            autoComplete="off"
          />
          <button
            className="btn-primary !w-11 !h-11 !p-0 flex items-center justify-center flex-shrink-0"
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
