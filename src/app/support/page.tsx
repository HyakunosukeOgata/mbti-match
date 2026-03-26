import BackButton from '@/components/BackButton';
import { Mail, Shield, AlertTriangle } from 'lucide-react';
import { contactConfig } from '@/lib/contact';

export default function SupportPage() {
  const { supportEmail, privacyEmail, reportEmail } = contactConfig;

  return (
    <div className="min-h-dvh px-6 py-8 max-w-2xl mx-auto">
      <BackButton />

      <h1 className="text-2xl font-bold mb-6">
        <span className="gradient-text">聯絡我們</span>
      </h1>

      <div className="space-y-4">
        <div className="glass-card !p-5 flex items-start gap-4 block">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">📧 客服信箱</h3>
            {supportEmail ? (
              <>
                <a href={`mailto:${supportEmail}`} className="text-sm text-primary underline underline-offset-4">{supportEmail}</a>
                <p className="text-xs text-text-secondary mt-1">我們通常會在 24 小時內回覆</p>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary">請先使用 App 內功能聯繫我們</p>
                <p className="text-xs text-text-secondary mt-1">若有登入、配對或使用問題，可先透過 App 內流程回報。</p>
              </>
            )}
          </div>
        </div>

        <div className="glass-card !p-5 flex items-start gap-4 block">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">🔒 隱私權問題</h3>
            {privacyEmail ? (
              <>
                <a href={`mailto:${privacyEmail}`} className="text-sm text-primary underline underline-offset-4">{privacyEmail}</a>
                <p className="text-xs text-text-secondary mt-1">帳號刪除、資料匯出等隱私相關請求</p>
              </>
            ) : (
              <p className="text-xs text-text-secondary mt-1">隱私相關需求目前請先使用 App 內刪除帳號流程或資料管理功能處理。</p>
            )}
          </div>
        </div>

        <div className="glass-card !p-5 flex items-start gap-4 block">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-text mb-1">🚨 檢舉不當行為</h3>
            {reportEmail ? (
              <>
                <a href={`mailto:${reportEmail}`} className="text-sm text-primary underline underline-offset-4">{reportEmail}</a>
                <p className="text-xs text-text-secondary mt-1">也可以在 App 內直接使用檢舉功能</p>
              </>
            ) : (
              <p className="text-xs text-text-secondary mt-1">目前請先直接使用 App 內檢舉功能，我們會依照系統紀錄處理。</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold text-text">常見問題</h2>

        <div className="glass-card !p-4">
          <h3 className="font-semibold text-text text-sm mb-1">如何刪除帳號？</h3>
          <p className="text-sm text-text-secondary">進入設定頁面，點選「刪除帳號」即可永久刪除所有資料。</p>
        </div>

        <div className="glass-card !p-4">
          <h3 className="font-semibold text-text text-sm mb-1">可以重新進行個性分析嗎？</h3>
          <p className="text-sm text-text-secondary">可以。進入設定頁面，選擇「重新聊天分析」即可重新進行個性分析。</p>
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
