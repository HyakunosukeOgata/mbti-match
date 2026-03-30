'use client';

import { useApp } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Smartphone, Mail, Apple, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import { signInWithOAuth, sendPhoneOtp, signInWithPassword, verifyPhoneOtp } from '@/lib/auth';

export default function LoginPage() {
  const { isLoggedIn, authReady, currentUser, onboardingStep } = useApp();
  const router = useRouter();
  const [testMode, setTestMode] = useState(false);
  const demoEnabled = process.env.NODE_ENV !== 'production' || testMode;

  const [step, setStep] = useState<'main' | 'methods' | 'phone'>('main');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [demoName, setDemoName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState('');
  const [oauthUrl, setOauthUrl] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('test')) {
      setTestMode(true);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (isLoggedIn && currentUser?.onboardingComplete) {
      router.replace('/home');
    } else if (isLoggedIn && currentUser?.aiPersonality && onboardingStep >= 4) {
      router.replace('/personality');
    } else if (isLoggedIn && onboardingStep >= 1) {
      router.replace('/onboarding/ai-chat');
    } else {
      track('page_view', { page: 'login' });
    }
  }, [authReady, isLoggedIn, currentUser, onboardingStep, router]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Force unregister service workers on login page to avoid stale cache
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(n => caches.delete(n)));
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
      } else {
        // Fallback: show clickable link in case redirect doesn't trigger
        setOauthUrl(data.url);
      }
    } catch (e: unknown) {
      setLoading('');
      setError(`登入時發生錯誤：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 8) {
      setError('請輸入正確的手機號碼（含國碼，如 +886912345678）');
      return;
    }
    setLoading('phone');
    setError('');
    const { error: authError } = await sendPhoneOtp(cleaned);
    setLoading('');
    if (authError) {
      setError('簡訊發送失敗：' + authError.message);
      return;
    }
    setOtpSent(true);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('請輸入 6 位數驗證碼');
      return;
    }
    setLoading('verify');
    setError('');
    const cleaned = phone.replace(/\s/g, '');
    const { error: authError } = await verifyPhoneOtp(cleaned, otpCode);
    setLoading('');
    if (authError) {
      setError('驗證碼錯誤或已過期');
    }
    // success → onAuthStateChange in store handles the rest
  };

  const handleDevStart = async () => {
    if (!demoName.trim()) {
      setError('請先輸入暱稱');
      return;
    }

    setLoading('demo');
    setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (testMode) {
        headers['x-test-code'] = 'mochi-test-2026';
      }
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers,
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
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #FFB088 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FF8C6B 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-accent opacity-40 animate-float" />
        <div className="absolute top-1/4 left-12 w-3 h-3 rounded-full bg-primary opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-20 w-2 h-2 rounded-full bg-primary-light opacity-40 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center animate-slide-up relative z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 gradient-bg" style={{ boxShadow: '0 8px 30px rgba(255, 140, 107, 0.3)' }}>
          <Sparkles size={34} color="white" />
        </div>
        <h1 className="text-3xl font-bold mb-1">
          <span className="gradient-text">Mochi 默契</span>
        </h1>
        <p className="text-text-secondary text-sm flex items-center justify-center gap-1">
          基於 16 型人格的智慧交友 <Heart size={12} className="text-accent" fill="currentColor" />
        </p>
      </div>

      {step === 'main' && (
        <>
          <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
            {demoEnabled && (
              <div className="bg-white rounded-3xl p-5 space-y-3 shadow-sm" style={{ border: '1px solid #F2E8E0' }}>
                <div>
                  <p className="text-sm font-semibold text-text mb-1">{testMode ? '測試登入' : '快速體驗'}</p>
                  <p className="text-xs text-text-secondary">{testMode ? '輸入暱稱直接進入系統測試' : '僅限本地開發與測試使用，會直接建立一個體驗帳號。'}</p>
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
            <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm" style={{ border: '1px solid #F2E8E0' }}>
              <button
                className="btn-primary w-full text-base"
                onClick={() => { setMode('login'); setStep('methods'); setError(''); }}
              >
                登入
              </button>
              <button
                className="w-full py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                style={{ border: '1px solid #E8DDD5', color: '#5A4A3F' }}
                onClick={() => { setMode('signup'); setStep('methods'); setError(''); }}
              >
                註冊
              </button>
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          </div>
          <p className="text-text-secondary text-xs mt-6 text-center relative z-10 opacity-80">
            登入即表示你同意我們的
            <a href="/terms" className="text-primary underline">服務條款</a>
            和
            <a href="/privacy" className="text-primary underline">隱私政策</a>
          </p>
        </>
      )}

      {step === 'methods' && (
        <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
          <div className="bg-white rounded-3xl p-6 space-y-3 shadow-sm" style={{ border: '1px solid #F2E8E0' }}>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => { setStep('main'); setError(''); }} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} className="text-text-secondary" />
              </button>
              <p className="text-sm font-medium text-text-secondary">{mode === 'login' ? '選擇登入方式' : '選擇註冊方式'}</p>
            </div>
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => handleOAuth('google')}
              disabled={!!loading}
            >
              {loading === 'google' ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              {mode === 'login' ? 'Gmail 登入' : 'Gmail 註冊'}
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
              style={{ background: '#000', color: '#fff' }}
              onClick={() => handleOAuth('apple')}
              disabled={!!loading}
            >
              {loading === 'apple' ? <Loader2 size={18} className="animate-spin" /> : <Apple size={18} />}
              {mode === 'login' ? 'Apple 登入' : 'Apple 註冊'}
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-medium text-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
              style={{ border: '1px solid #E8DDD5', color: '#5A4A3F' }}
              onClick={() => { setStep('phone'); setError(''); }}
              disabled={!!loading}
            >
              <Smartphone size={18} /> {mode === 'login' ? '手機登入' : '手機註冊'}
            </button>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            {oauthUrl && (
              <a href={oauthUrl} className="block text-center text-xs text-primary underline mt-2">點此手動前往登入 →</a>
            )}
          </div>
        </div>
      )}

      {step === 'phone' && (
        <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
          <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm" style={{ border: '1px solid #F2E8E0' }}>
            <div className="flex items-center gap-2">
              <button onClick={() => { setStep('methods'); setError(''); setOtpSent(false); setOtpCode(''); }} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} className="text-text-secondary" />
              </button>
              <p className="text-sm font-medium text-text-secondary">手機驗證</p>
            </div>

            {!otpSent ? (
              <>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">手機號碼</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+886 912 345 678"
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                    style={{ border: '1px solid #E8DDD5', background: '#FFFAF7' }}
                    autoFocus
                  />
                  <p className="text-[11px] text-text-secondary opacity-60 mt-1">請輸入含國碼的手機號碼</p>
                </div>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={handleSendOtp}
                  disabled={!!loading}
                >
                  {loading === 'phone' ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                  發送驗證碼
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary text-center">
                  驗證碼已發送至 <strong>{phone}</strong>
                </p>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">驗證碼</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 位數驗證碼"
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all text-center tracking-[0.5em] font-mono text-lg"
                    style={{ border: '1px solid #E8DDD5', background: '#FFFAF7' }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                  />
                </div>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={handleVerifyOtp}
                  disabled={!!loading}
                >
                  {loading === 'verify' && <Loader2 size={16} className="animate-spin" />}
                  確認驗證碼
                </button>
                <button
                  className="text-xs text-text-secondary text-center w-full"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || !!loading}
                >
                  {countdown > 0 ? `重新發送（${countdown}s）` : '重新發送驗證碼'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SEO footer */}
      <div className="mt-6 text-center relative z-10">
        <p className="text-text-secondary text-[11px] opacity-60 leading-relaxed max-w-xs">
          Mochi 默契 — 基於 16 型人格的智慧配對交友平台。
        </p>
      </div>
    </div>
  );
}
