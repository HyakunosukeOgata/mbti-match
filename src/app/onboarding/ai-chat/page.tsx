'use client';

import { ONBOARDING_CHAT_STORAGE_KEY, readScopedJSON, removeScopedStorage, writeScopedJSON } from '@/lib/client-storage';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIOnboardingChatPage() {
  const { currentUser, authReady, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();
  const [isResetMode, setIsResetMode] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [startTime] = useState(Date.now());
  const [error, setError] = useState('');
  const [readyToAnalyze, setReadyToAnalyze] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedStartRef = useRef(false);

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
    }
    // In reset mode, skip onboarding redirect even if onboarding is complete
  }, [authReady, currentUser, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsResetMode(new URLSearchParams(window.location.search).get('mode') === 'reset');
  }, []);

  useEffect(() => {
    if (!currentUser?.id || isResetMode || trackedStartRef.current) return;
    track('onboarding_start');
    trackedStartRef.current = true;
  }, [currentUser?.id, isResetMode]);

  // Get initial AI greeting
  useEffect(() => {
    if (!currentUser?.id || messages.length > 0) return;

    if (isResetMode) {
      removeScopedStorage([ONBOARDING_CHAT_STORAGE_KEY], currentUser.id);
    } else {
      const stored = readScopedJSON<ChatMsg[]>(ONBOARDING_CHAT_STORAGE_KEY, currentUser.id, []);
      if (stored.length > 0) {
        setMessages(stored);
        setReadyToAnalyze(stored.filter((msg) => msg.role === 'user').length >= 5);
        return;
      }
    }

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
        if (!res.ok) throw new Error('API error');
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
  }, [currentUser?.id, isResetMode, messages.length]);

  useEffect(() => {
    if (!currentUser?.id || messages.length === 0) return;
    writeScopedJSON(ONBOARDING_CHAT_STORAGE_KEY, currentUser.id, messages);
  }, [messages, currentUser?.id]);

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
      if (!res.ok) {
        setError('AI 暫時無法回覆，請再試一次');
        setMessages(prev => prev.slice(0, -1));
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.readyToAnalyze) {
          setReadyToAnalyze(true);
        }
      }
    } catch {
      setError('網路不穩，請再試一次');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);

  const finishChat = useCallback(async () => {
    if (analyzing || !currentUser) return;

    if (!isResetMode) {
      writeScopedJSON(ONBOARDING_CHAT_STORAGE_KEY, currentUser.id, messages);
      track('ai_chat_complete', {
        messageCount: userMessageCount,
        seconds: Math.round((Date.now() - startTime) / 1000),
      });
      setOnboardingStep(2);
      router.push('/onboarding/profile');
      return;
    }

    setAnalyzing(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          messages,
          profile: {
            nickname: currentUser.name,
            occupation: currentUser.occupation,
            education: currentUser.education,
            age: currentUser.age,
            gender: currentUser.gender,
            region: currentUser.preferences.region,
            bio: currentUser.bio,
            ageMin: currentUser.preferences.ageMin,
            ageMax: currentUser.preferences.ageMax,
            genderPreference: currentUser.preferences.genderPreference,
            preferredRegions: currentUser.preferences.preferredRegions || [],
            photoCount: currentUser.photos.length,
          },
        }),
      });
      const data = await res.json();

      if (data.personality) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        track('ai_chat_complete', { messageCount: userMessageCount, seconds: elapsed });

        await updateProfile({
          aiPersonality: {
            bio: data.personality.bio || '',
            traits: data.personality.traits || [],
            values: data.personality.values || [],
            communicationStyle: data.personality.communicationStyle || '',
            relationshipGoal: data.personality.relationshipGoal || '',
            chatSummary: data.personality.chatSummary || '',
            analyzedAt: new Date().toISOString(),
            datingStyle: data.personality.datingStyle || '',
            redFlags: data.personality.redFlags || [],
            tags: data.personality.tags || [],
            scoringFeatures: data.personality.scoringFeatures || undefined,
          },
          bio: data.personality.bio || currentUser.bio || '',
        });
        removeScopedStorage([ONBOARDING_CHAT_STORAGE_KEY], currentUser.id);

        router.push('/personality');
      } else {
        setError('分析失敗，請再試一次');
      }
    } catch {
      setError('網路不穩，請再試一次');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, currentUser, isResetMode, messages, router, setOnboardingStep, startTime, updateProfile, userMessageCount]);

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
          AI 正在根據我們的聊天生成你的專屬介紹...
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
          <p className="text-sm font-medium text-text-secondary">{isResetMode ? '🔄 重新分析個性' : '💬 步驟 2/3 · AI 聊聊'}</p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: readyToAnalyze ? '66%' : `${33 + Math.min(userMessageCount * 4, 28)}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {readyToAnalyze
            ? isResetMode ? '✅ 小默已經重新了解你了！點下方按鈕更新檔案' : '✅ 小默已經了解你了！接著補完個人資料'
            : '通常聊 5-6 次有內容的回覆就能完成，放心，不會變成沒完沒了的問答。'}
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
            {isResetMode ? '重新整理我的檔案 ✨' : '進入個人資料設定 ✨'}
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
