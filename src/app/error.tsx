'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FFF9F5' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(255, 140, 107, 0.1)' }}>
        <span className="text-4xl">😿</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">
        <span className="gradient-text">哎呀，出了點問題</span>
      </h1>
      <p className="text-text-secondary text-sm mb-6 max-w-xs">
        別擔心，你的資料沒有受到影響。請重新嘗試。
      </p>
      <button className="btn-primary" onClick={reset}>
        🔄 重新嘗試
      </button>
    </div>
  );
}
