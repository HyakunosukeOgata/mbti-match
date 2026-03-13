'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
        <span className="gradient-text">服務條款</span>
      </h1>

      <div className="prose-sm space-y-6 text-text-secondary leading-relaxed">
        <p className="text-xs">最後更新日期：2026 年 3 月 13 日</p>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">1. 服務說明</h2>
          <p>Mochi 默契（以下簡稱「本服務」）是一款基於 MBTI 人格特質的社交配對平台，旨在幫助使用者透過性格分析找到契合的對象。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">2. 使用資格</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>您必須年滿 18 歲方可使用本服務</li>
            <li>您同意提供真實、準確的個人資料</li>
            <li>每位使用者僅能擁有一個帳號</li>
            <li>您必須具備完全行為能力</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">3. 使用者行為規範</h2>
          <p>使用本服務時，您同意不得：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>上傳不雅、暴力、仇恨或違法內容</li>
            <li>騷擾、威脅或欺騙其他使用者</li>
            <li>發送垃圾訊息或進行商業推銷</li>
            <li>冒充他人或提供虛假資訊</li>
            <li>嘗試破解、入侵或干擾本服務系統</li>
            <li>從事任何違反當地法律的行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">4. 內容所有權</h2>
          <p>您上傳至本服務的內容（照片、文字等）之智慧財產權歸您所有。但您授予本服務非獨占性、全球性的使用權，以提供、推廣本服務。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">5. 配對機制</h2>
          <p>本服務透過 MBTI 人格分析與情境題回答計算配對相容度。配對結果僅供參考，不保證配對成功或感情結果。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">6. 帳號管理</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>您有責任保管帳號安全</li>
            <li>您可隨時在設定中刪除帳號</li>
            <li>帳號刪除後，相關資料將在合理期間內永久刪除</li>
            <li>違反使用條款的帳號可能被暫停或終止</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">7. 免責聲明</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>本服務以「現狀」提供，不提供任何明示或暗示的保證</li>
            <li>對於使用者間的互動及其後果，本服務不承擔責任</li>
            <li>建議使用者在線下見面時注意人身安全</li>
            <li>本服務不對因系統故障或維護造成的服務中斷負責</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">8. 隱私保護</h2>
          <p>您的個人資料受我們的<a href="/privacy" className="text-primary underline">隱私權政策</a>保護。使用本服務即表示您同意該政策中的資料處理方式。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">9. 條款修改</h2>
          <p>我們保留修改本服務條款的權利。修改後繼續使用本服務，即表示您接受新條款。重大修改將提前通知。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">10. 準據法</h2>
          <p>本條款受中華民國法律管轄。任何爭議應以臺灣臺北地方法院為第一審管轄法院。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">11. 聯絡方式</h2>
          <p>如有任何問題，請聯繫：</p>
          <p className="mt-1">📧 support@mochi-match.com</p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-xs text-text-secondary">© 2026 Mochi 默契. All rights reserved.</p>
      </div>
    </div>
  );
}
