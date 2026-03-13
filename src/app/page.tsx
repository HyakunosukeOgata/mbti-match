'use client';

import { useApp } from '@/lib/store';
import { useState, useEffect } from 'react';
import { Sparkles, Heart, Smartphone, Mail, Apple, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';

export default function LoginPage() {
  const { isLoggedIn, login, currentUser, onboardingStep } = useApp();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn && currentUser?.onboardingComplete) {
      router.replace('/home');
    } else if (isLoggedIn && onboardingStep >= 1) {
      router.replace('/onboarding/mbti');
    } else {
      track('page_view', { page: 'login' });
    }
  }, [isLoggedIn, currentUser, onboardingStep, router]);

  const handleQuickLogin = (method: string) => {
    setSelectedMethod(method);
    setAgeConfirmed(true);
  };

  const handleConfirmAge = () => {
    login(selectedMethod + '用戶');
  };

  if (isLoggedIn) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #F4A261 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #E8842C 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-accent opacity-40 animate-float" />
        <div className="absolute top-1/4 left-12 w-3 h-3 rounded-full bg-primary opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-20 w-2 h-2 rounded-full bg-primary-light opacity-40 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Logo */}
      <div className="mb-10 text-center animate-slide-up relative z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 gradient-bg" style={{ boxShadow: '0 8px 30px var(--shadow-primary-strong)' }}>
          <Sparkles size={34} color="white" />
        </div>
        <h1 className="text-3xl font-bold mb-1">
          <span className="gradient-text">Mochi 默契</span>
        </h1>
        <p className="text-text-secondary text-sm flex items-center justify-center gap-1">
          基於 16 型人格的智慧交友 <Heart size={12} className="text-accent" fill="currentColor" />
        </p>
      </div>

      {!ageConfirmed ? (
        <>
          <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
            <div className="glass-card !p-5 space-y-3">
              <p className="text-sm font-medium text-center text-text-secondary mb-1">選擇登入方式</p>
              <button className="btn-primary flex items-center justify-center gap-2" onClick={() => handleQuickLogin('手機')}>
                <Smartphone size={18} /> 手機登入
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2" onClick={() => handleQuickLogin('Gmail')}>
                <Mail size={18} /> Gmail 登入
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2" onClick={() => handleQuickLogin('Apple')}>
                <Apple size={18} /> Apple 登入
              </button>
            </div>
          </div>

          <p className="text-text-secondary text-xs mt-8 text-center relative z-10 opacity-80">
            登入即表示你同意我們的
            <a href="/terms" className="text-primary underline">服務條款</a>
            和
            <a href="/privacy" className="text-primary underline">隱私政策</a>
          </p>
        </>
      ) : (
        <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
          <div className="glass-card !p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(232, 132, 44, 0.1)' }}>
              <ShieldCheck size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-text">年齡確認</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Mochi 默契為交友配對平台，<br />僅限 <strong>18 歲以上</strong>使用者使用。
            </p>
            <button className="btn-primary" onClick={handleConfirmAge}>
              我已滿 18 歲，開始配對
            </button>
            <button className="text-xs text-text-secondary opacity-60 hover:opacity-100 transition-opacity" onClick={() => setAgeConfirmed(false)}>
              ← 返回
            </button>
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
