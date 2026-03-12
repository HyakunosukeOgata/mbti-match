'use client';

import { useApp } from '@/lib/store';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { isLoggedIn, login, currentUser, onboardingStep } = useApp();
  const [name, setName] = useState('');
  const router = useRouter();

  // 已登入 → 導向對應頁面
  useEffect(() => {
    if (isLoggedIn && currentUser?.onboardingComplete) {
      router.replace('/home');
    } else if (isLoggedIn && onboardingStep >= 1) {
      router.replace('/onboarding/mbti');
    }
  }, [isLoggedIn, currentUser, onboardingStep, router]);

  const handleLogin = (loginName?: string) => {
    const finalName = loginName || name.trim();
    if (!finalName) return;
    login(finalName);
  };

  if (isLoggedIn) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center animate-slide-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary"
        >
          <Sparkles size={28} color="white" />
        </div>
        <h1 className="text-2xl font-bold mb-1">MBTI Match</h1>
        <p className="text-text-secondary text-sm">用性格，找到對的人</p>
      </div>

      {/* 登入表單 */}
      <div className="w-full space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <label className="text-sm text-text-secondary mb-2 block">你的暱稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="輸入你的暱稱"
            className="w-full"
          />
        </div>

        <button className="btn-primary" onClick={() => handleLogin()} disabled={!name.trim()}>
          開始配對之旅
        </button>

        <div className="text-center space-y-3 pt-4">
          <p className="text-text-secondary text-xs">或使用以下方式登入</p>
          <div className="flex gap-3 justify-center">
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => handleLogin('Demo 用戶')}>
              手機
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => handleLogin('Gmail 用戶')}>
              Gmail
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => handleLogin('Apple 用戶')}>
              Apple
            </button>
          </div>
        </div>
      </div>

      <p className="text-text-secondary text-xs mt-8 text-center">
        登入即表示你同意我們的服務條款和隱私政策
      </p>
    </div>
  );
}
