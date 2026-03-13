'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowBanner(true);
        track('pwa_install_prompt');
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      track('pwa_installed');
    }
    setInstallPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="glass-card p-4 rounded-2xl flex items-center gap-3" style={{ boxShadow: '0 8px 32px rgba(232, 132, 44, 0.2)' }}>
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">默</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text">加到主畫面</p>
          <p className="text-xs text-text-secondary">安裝 Mochi 享受完整體驗</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #E8842C, #F4A261)' }}
        >
          安裝
        </button>
        <button
          onClick={handleDismiss}
          className="text-text-secondary text-lg leading-none shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
