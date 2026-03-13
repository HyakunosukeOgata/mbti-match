'use client';

import { useApp } from '@/lib/store';
import { useState, useEffect } from 'react';
import { Sparkles, Heart, Smartphone, Mail, Apple } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import { moderateName } from '@/lib/moderation';
import { signInWithApple, isAppleSignInAvailable } from '@/lib/apple-auth';

export default function LoginPage() {
  const { isLoggedIn, login, currentUser, onboardingStep } = useApp();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [appleLoading, setAppleLoading] = useState(false);
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

  const handleLogin = (loginName?: string) => {
    const finalName = loginName || name.trim();
    if (!finalName) return;
    const check = moderateName(finalName);
    if (!check.allowed) {
      setNameError(check.reason || '名稱無效');
      setTimeout(() => setNameError(''), 3000);
      return;
    }
    login(finalName);
  };

  const handleAppleSignIn = async () => {
    if (!isAppleSignInAvailable()) {
      // Web fallback: use demo login
      handleLogin('Apple 用戶');
      return;
    }
    setAppleLoading(true);
    try {
      const result = await signInWithApple();
      if (result.success && result.user) {
        track('apple_sign_in');
        login(result.user.name);
      } else if (result.error) {
        setNameError(result.error);
        setTimeout(() => setNameError(''), 3000);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  if (isLoggedIn) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-accent opacity-40 animate-float" />
        <div className="absolute top-1/4 left-12 w-3 h-3 rounded-full bg-primary opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-20 w-2 h-2 rounded-full bg-primary-light opacity-40 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Logo */}
      <div className="mb-10 text-center animate-slide-up relative z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 gradient-bg animate-float" style={{ boxShadow: '0 8px 30px rgba(124, 58, 237, 0.35)' }}>
          <Sparkles size={34} color="white" />
        </div>
        <h1 className="text-3xl font-extrabold mb-1">
          <span className="gradient-text">Mochi 默契</span>
        </h1>
        <p className="text-text-secondary text-sm flex items-center justify-center gap-1">
          用性格，找到對的人 <Heart size={12} className="text-accent" fill="currentColor" />
        </p>
      </div>

      {/* Login form */}
      <div className="w-full space-y-4 animate-slide-up relative z-10" style={{ animationDelay: '0.15s' }}>
        <div className="glass-card !p-5 space-y-4">
          <div>
            <label htmlFor="login-name" className="text-sm font-medium text-text-secondary mb-2 block">✨ 你的昱稱</label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="取一個喜歡的名字吧"
              maxLength={20}
              className="w-full"
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1">{nameError}</p>
            )}
          </div>

          <button className="btn-primary" onClick={() => handleLogin()} disabled={!name.trim()}>
            ✨ 開始配對之旅
          </button>
        </div>

        <div className="text-center space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="text-text-secondary text-xs">快速登入</p>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-3 justify-center">
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => handleLogin('Demo 用戶')}>
              <Smartphone size={16} /> 手機
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => handleLogin('Gmail 用戶')}>
              <Mail size={16} /> Gmail
            </button>
            <button
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
              onClick={handleAppleSignIn}
              disabled={appleLoading}
            >
              <Apple size={16} /> {appleLoading ? '...' : 'Apple'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-text-secondary text-xs mt-8 text-center relative z-10 opacity-60">
        登入即表示你同意我們的
        <a href="/terms" className="text-primary underline">服務條款</a>
        和
        <a href="/privacy" className="text-primary underline">隱私政策</a>
      </p>

      {/* SEO footer */}
      <div className="mt-6 text-center relative z-10">
        <p className="text-text-secondary text-[10px] opacity-40 leading-relaxed max-w-xs">
          Mochi 默契 — 基於 16 型人格的智慧配對交友平台。
        </p>
      </div>
    </div>
  );
}
