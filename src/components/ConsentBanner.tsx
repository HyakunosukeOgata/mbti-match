'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'mochi_analytics_consent';

export function getAnalyticsConsent(): boolean | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(CONSENT_KEY);
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null; // not yet decided
}

export function setAnalyticsConsent(consent: boolean) {
  localStorage.setItem(CONSENT_KEY, String(consent));
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getAnalyticsConsent();
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up" style={{ background: 'rgba(30,27,75, 0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-lg mx-auto">
        <p className="text-white text-sm mb-1 font-medium">🍪 使用體驗分析</p>
        <p className="text-white/70 text-xs mb-3 leading-relaxed">
          我們使用匿名分析來改善服務體驗。資料僅儲存在你的裝置上，不會傳送至伺服器。
          詳情請參考<a href="/privacy" className="text-purple-300 underline">隱私權政策</a>。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
          >
            拒絕
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white gradient-bg transition-colors"
          >
            同意
          </button>
        </div>
      </div>
    </div>
  );
}
