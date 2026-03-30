'use client';

import { signInWithPassword, signOut } from '@/lib/auth';
import { useApp } from '@/lib/store';
import { Sparkles, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function buildTestName() {
  const stamp = Date.now().toString().slice(-6);
  return `測試員${stamp}`;
}

export default function TestEntryPage() {
  const { authReady, currentUser, onboardingStep } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(buildTestName());
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (currentUser?.onboardingComplete) {
      router.replace('/home');
      return;
    }

    if (currentUser?.aiPersonality && onboardingStep >= 4) {
      router.replace('/personality');
      return;
    }

    if (currentUser) {
      router.replace('/onboarding/ai-chat');
      return;
    }

    setLoading(false);
  }, [authReady, currentUser, onboardingStep, router]);

  const handleStart = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('請保留一個測試暱稱');
      return;
    }

    setWorking(true);
    setError('');

    try {
      await signOut();

      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-code': 'mochi-test-2026',
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.email || !payload.password) {
        throw new Error(payload.error || '建立測試帳號失敗');
      }

      const { error: authError } = await signInWithPassword(payload.email, payload.password);
      if (authError) {
        throw new Error(authError.message || '測試登入失敗');
      }
    } catch (cause) {
      setWorking(false);
      setError(cause instanceof Error ? cause.message : '測試登入失敗');
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <Loader2 size={28} className="animate-spin text-primary mb-4" />
        <p className="text-sm text-text-secondary">正在檢查測試狀態...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #FFB088 0%, transparent 70%)' }} />
        <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF8C6B 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 gradient-bg" style={{ boxShadow: '0 8px 30px rgba(255, 140, 107, 0.3)' }}>
            <Sparkles size={34} color="white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Mochi 測試入口</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            直接建立測試帳號並跳過登入頁，方便你完整測配對、自介、聊天與檢舉流程。
          </p>
        </div>

        <div className="card space-y-4">
          <div>
            <p className="text-sm font-semibold text-text mb-1">測試帳號名稱</p>
            <p className="text-xs text-text-secondary mb-3">每次可換不同名稱，避免接續舊測試進度。</p>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 20))}
              placeholder="輸入測試暱稱"
              className="input w-full"
              disabled={working}
            />
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'rgba(255, 140, 107, 0.05)', border: '1px solid rgba(255, 140, 107, 0.08)' }}>
            <p className="text-xs font-semibold text-text-secondary mb-2">這條測試路會自動準備</p>
            <div className="space-y-1.5 text-sm text-text">
              <p>1. 直接建立並登入測試帳號</p>
              <p>2. 保留完整 onboarding 流程給你人工測</p>
              <p>3. 預先灌入 demo bots、配對與聊天資料</p>
              <p>4. 可接著測首頁、自我介紹、配對、聊天、檢舉</p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger text-center">{error}</p>
          )}

          <button
            className="btn-primary flex items-center justify-center gap-2"
            onClick={() => { void handleStart(); }}
            disabled={working || !name.trim()}
          >
            {working ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {working ? '進入測試系統中...' : '直接進入完整測試'}
          </button>

          <button
            className="btn-secondary w-full flex items-center justify-center gap-2"
            onClick={() => setName(buildTestName())}
            disabled={working}
          >
            <RotateCcw size={16} /> 重新產生測試名稱
          </button>
        </div>
      </div>
    </div>
  );
}