'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Shield, AlertTriangle } from 'lucide-react';

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh px-6 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-secondary hover:text-text mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">返回</span>
      </button>

      <h1 className="text-2xl font-bold mb-6">
        <span className="gradient-text">聯絡我們</span>
      </h1>

      <div className="space-y-4">
        <a
          href="mailto:support@mochi-match.com"
          className="glass-card !p-5 flex items-start gap-4 block hover:scale-[1.01] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">📧 客服信箱</h3>
            <p className="text-sm text-text-secondary">support@mochi-match.com</p>
            <p className="text-xs text-text-secondary mt-1">我們通常會在 24 小時內回覆</p>
          </div>
        </a>

        <a
          href="mailto:privacy@mochi-match.com"
          className="glass-card !p-5 flex items-start gap-4 block hover:scale-[1.01] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">🔒 隱私權問題</h3>
            <p className="text-sm text-text-secondary">privacy@mochi-match.com</p>
            <p className="text-xs text-text-secondary mt-1">帳號刪除、資料匯出等隱私相關請求</p>
          </div>
        </a>

        <a
          href="mailto:report@mochi-match.com"
          className="glass-card !p-5 flex items-start gap-4 block hover:scale-[1.01] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">🚨 檢舉不當行為</h3>
            <p className="text-sm text-text-secondary">report@mochi-match.com</p>
            <p className="text-xs text-text-secondary mt-1">也可以在 App 內直接使用檢舉功能</p>
          </div>
        </a>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold text-text">常見問題</h2>

        <div className="glass-card !p-4">
          <h3 className="font-semibold text-text text-sm mb-1">如何刪除帳號？</h3>
          <p className="text-sm text-text-secondary">進入設定頁面，點選「刪除帳號」即可永久刪除所有資料。</p>
        </div>

        <div className="glass-card !p-4">
          <h3 className="font-semibold text-text text-sm mb-1">可以重新測試 MBTI 嗎？</h3>
          <p className="text-sm text-text-secondary">可以。進入設定頁面，選擇「重新測試 MBTI」即可重新進行人格測驗。</p>
        </div>

        <div className="glass-card !p-4">
          <h3 className="font-semibold text-text text-sm mb-1">Mochi 默契是免費的嗎？</h3>
          <p className="text-sm text-text-secondary">是的。目前所有功能完全免費使用。</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-xs text-text-secondary">© 2026 Mochi 默契. All rights reserved.</p>
      </div>
    </div>
  );
}
