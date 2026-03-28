'use client';

import { useApp } from '@/lib/store';
import { useState, useEffect } from 'react';
import { Sparkles, Heart, Apple, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import { signInWithOAuth, signInWithPassword } from '@/lib/auth';

export default function LoginPage() {
  const { isLoggedIn, authReady, currentUser, onboardingStep } = useApp();
  const router = useRouter();
  const demoEnabled = process.env.NODE_ENV !== 'production';

  const [demoName, setDemoName] = useState('');
  const [loading, setLoading] = useState('');
  const [oauthUrl, setOauthUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady) return;
    if (isLoggedIn && currentUser?.onboardingComplete) {
      router.replace('/home');
    } else if (isLoggedIn && onboardingStep >= 1) {
      router.replace(currentUser?.aiPersonality ? '/personality' : '/onboarding/ai-chat');
    } else {
      track('page_view', { page: 'login' });
    }
  }, [authReady, isLoggedIn, currentUser, onboardingStep, router]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
  }, []);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      setLoading(provider);
      setError('');
      setOauthUrl('');
      const { data, error: authError } = await signInWithOAuth(provider);
      setLoading('');
      if (authError) {
        setError(authError.message || (provider === 'google' ? 'Gmail 登入失敗，請稍後再試' : 'Apple 登入失敗，請稍後再試'));
        return;
      }
      if (!data?.url) {
        setError(provider === 'google' ? 'Gmail 授權連結建立失敗' : 'Apple 授權連結建立失敗');
        return;
      }
      setOauthUrl(data.url);
    } catch (e: unknown) {
      setLoading('');
      setError(`登入時發生錯誤：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleDevStart = async () => {
    if (!demoName.trim()) {
      setError('請先輸入暱稱');
      return;
    }

    setLoading('demo');
    setError('');
    try {
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: demoName.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.email || !payload.password) {
        setError(payload.error || '快速體驗登入失敗');
        setLoading('');
        return;
      }

      const { error: authError } = await signInWithPassword(payload.email, payload.password);
      setLoading('');
      if (authError) {
        setError(authError.message || '快速體驗登入失敗');
      }
    } catch (e: unknown) {
      setLoading('');
      setError(`快速體驗登入失敗：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  if (isLoggedIn) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #FFB088 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF8C6B 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-accent opacity-40 animate-float" />
        <div className="absolute top-1/4 left-12 w-3 h-3 rounded-full bg-primary opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-20 w-2 h-2 rounded-full bg-primary-light opacity-40 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="mb-8 text-center animate-slide-up relative z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 gradient-bg" style={{ boxShadow: '0 8px 30px rgba(255, 140, 107, 0.3)' }}>
          <Sparkles size={34} color="white" />
        </div>
        <h1 className="text-3xl font-bold mb-1">
          <span className="gradient-text">Mochi 默契</span>
        </h1>
        <p className="text-text-secondary text-sm flex items-center justify-center gap-1">
          一起找到對的人 <Heart size={12} className="text-accent" fill="currentColor" />
        </p>
      </div>

      <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
        {demoEnabled && (
          <div className="bg-white rounded-3xl p-5 space-y-3 shadow-sm" style={{ border: '1px solid #F2E8E0' }}>
            <div>
              <p className="text-sm font-semibold text-text mb-1">快速體驗</p>
              <p className="text-xs text-text-secondary">僅限本地開發與測試使用，會直接建立一個體驗帳號。</p>
            </div>
            <input
              type="text"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value.slice(0, 20))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleDevStart();
                }
              }}
              placeholder="輸入你的暱稱"
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{ border: '1px solid #E8DDD5', background: '#FFFAF7' }}
            />
            <button
              className="btn-primary w-full text-base"
              onClick={() => { void handleDevStart(); }}
              disabled={!demoName.trim() || !!loading}
            >
              {loading === 'demo' ? '建立體驗中...' : '開始配對之旅'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 space-y-3 shadow-sm" style={{ border: '1px solid #F2E8E0' }}>
          <p className="text-sm font-medium text-text-secondary mb-1">選擇登入方式</p>
          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={() => { void handleOAuth('google'); }}
            disabled={!!loading}
          >
            {loading === 'google' ? <Loader2 size={18} className="animate-spin" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
            Gmail 登入
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            style={{ background: '#000', color: '#fff' }}
            onClick={() => { void handleOAuth('apple'); }}
            disabled={!!loading}
          >
            {loading === 'apple' ? <Loader2 size={18} className="animate-spin" /> : <Apple size={18} />}
            Apple 登入
          </button>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          {oauthUrl && (
            <a href={oauthUrl} className="block text-center text-xs text-primary underline mt-2">點此手動前往登入 →</a>
          )}
        </div>
      </div>

      <p className="text-text-secondary text-xs mt-6 text-center relative z-10 opacity-80">
        登入即表示你同意我們的
        <a href="/terms" className="text-primary underline py-3 inline-block">服務條款</a>
        和
        <a href="/privacy" className="text-primary underline py-3 inline-block">隱私政策</a>
      </p>
      <button
        className="mt-3 text-sm font-medium text-primary relative z-10"
        onClick={() => router.push('/try')}
      >
        先不登入，直接跟 AI 聊聊 →
      </button>

      <div className="mt-6 text-center relative z-10">
        <p className="text-text-secondary text-[11px] opacity-60 leading-relaxed max-w-xs">
          Mochi 默契 — 基於 16 型人格的智慧配對交友平台。
        </p>
      </div>
    </div>
  );
}
