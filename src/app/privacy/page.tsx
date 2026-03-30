import BackButton from '@/components/BackButton';
import { contactConfig } from '@/lib/contact';

export default function PrivacyPage() {
  const { privacyEmail } = contactConfig;

  return (
    <div className="min-h-dvh px-6 py-8 max-w-2xl mx-auto">
      <BackButton />

      <h1 className="text-2xl font-bold mb-6">
        <span className="gradient-text">隱私權政策</span>
      </h1>

      <div className="prose-sm space-y-6 text-text-secondary leading-relaxed">
        <p className="text-xs">最後更新日期：2026 年 3 月 13 日</p>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">1. 資料蒐集</h2>
          <p>Mochi 默契（以下簡稱「本服務」）在您使用本服務時，可能蒐集以下資訊：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>您提供的個人資料：暱稱、年齡、性別、自我介紹、照片、AI 個性分析結果</li>
            <li>配對偏好：年齡範圍、性別偏好、地區</li>
            <li>使用行為：瀏覽、配對互動、聊天紀錄</li>
            <li>裝置資訊：瀏覽器類型、作業系統、裝置識別碼</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">2. 資料使用目的</h2>
          <p>我們蒐集的資料僅用於以下目的：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>提供及改善配對服務</li>
            <li>個人化推薦與內容</li>
            <li>帳號管理與安全保護</li>
            <li>統計分析與服務優化（匿名化處理）</li>
            <li>遵守法律義務</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">3. 資料保護</h2>
          <p>我們採取合理的技術及組織措施保護您的個人資料，包括但不限於：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>資料傳輸加密（HTTPS / TLS）</li>
            <li>存取權限控管</li>
            <li>定期安全審查</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">4. 資料分享</h2>
          <p>我們不會將您的個人資料出售予第三方。僅在以下情形可能分享：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>取得您的明確同意</li>
            <li>法律要求或司法程序</li>
            <li>保護本服務或其他用戶的權益與安全</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">5. 您的權利</h2>
          <p>依據個人資料保護法及 GDPR，您享有以下權利：</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>查閱、更正您的個人資料</li>
            <li>要求刪除您的帳號及相關資料</li>
            <li>撤回同意（不影響撤回前的合法處理）</li>
            <li>資料可攜性：要求以結構化格式取得您的資料</li>
            <li>限制處理或反對處理</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">6. Cookie 與追蹤</h2>
          <p>本服務使用 localStorage 儲存您的使用偏好與匿名化分析資料。您可隨時透過瀏覽器設定清除這些資料。我們會在首次使用前詢問您是否同意追蹤分析。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">7. 未成年人保護</h2>
          <p>本服務僅供 18 歲以上使用者使用。我們不會故意蒐集未滿 18 歲使用者的個人資料。若發現未成年使用者，我們將刪除其帳號及相關資料。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">8. 政策變更</h2>
          <p>我們保留隨時修改本隱私權政策的權利。重大變更將透過應用程式內通知或電子郵件告知。</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-text mb-2">9. 聯絡我們</h2>
          <p>如有任何隱私權相關問題，請聯繫：</p>
          <p className="mt-1">📧 {privacyEmail || '目前請先使用 App 內資料管理與刪除帳號流程提出請求。'}</p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <p className="text-xs text-text-secondary">© 2026 Mochi 默契. All rights reserved.</p>
      </div>
    </div>
  );
}
