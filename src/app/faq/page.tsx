'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  q: string;
  a: string;
}

const sections: { title: string; icon: string; items: FAQItem[] }[] = [
  {
    title: '新手教學',
    icon: '🚀',
    items: [
      {
        q: '如何開始使用 Mochi 默契？',
        a: '1. 選擇登入方式（手機、Gmail 或 Apple）\n2. 與 AI 聊天五分鐘，讓系統了解你的個性\n3. 填寫個人資料與照片\n\n完成後系統每天會推薦契合的對象給你！',
      },
      {
        q: '如何提高配對成功率？',
        a: '• 上傳清晰的個人照片（最多 6 張）\n• 認真填寫自我介紹\n• 認真跟 AI 聊天，系統會根據你的個性計算契合度\n• 在今日話題中寫出有深度的回答',
      },
      {
        q: '每天可以看到幾位推薦？',
        a: '每天會收到 5 位精選推薦。推薦會在 24 小時後刷新，記得每天回來看看！',
      },
    ],
  },
  {
    title: '配對與聊天',
    icon: '💬',
    items: [
      {
        q: '怎麼跟對方配對成功？',
        a: '在推薦卡片點開詳情後，回答今日話題並送出「喜歡」。如果對方也喜歡你，就會配對成功，可以開始聊天！',
      },
      {
        q: '配對度是怎麼計算的？',
        a: '配對度基於 AI 分析兩人的個性、價值觀和溝通風格的匹配程度。配對度越高，代表你們在生活方式和價值觀上越契合。',
      },
      {
        q: '為什麼我要先回答話題才能送出喜歡？',
        a: '比起只看照片滑左滑右，我們希望你透過話題展現真實的自己。這樣配對後聊天也更容易開啟有深度的對話！',
      },
      {
        q: '如何傳送圖片給對方？',
        a: '為了保護雙方隱私，圖片傳送需要雙方同意。在聊天畫面點擊左下角的 📷 圖片按鈕，會向對方發出請求，對方同意後雙方才能互傳圖片。',
      },
    ],
  },
  {
    title: '安全與隱私',
    icon: '🔒',
    items: [
      {
        q: '我的資料安全嗎？',
        a: '你的個人資料和聊天內容都經過加密儲存。我們不會將你的資料分享給第三方。你可以隨時在設定中暫停配對或刪除帳號。',
      },
      {
        q: '遇到不適當的用戶怎麼辦？',
        a: '在聊天畫面右上角點擊盾牌圖示，可以選擇「檢舉」或「離開對話」。檢舉後我們會儘快審查處理。',
      },
      {
        q: '可以隱藏年齡嗎？',
        a: '可以！前往「我的」→「安全與隱私」→「隱私設定」，開啟「隱藏年齡」選項。',
      },
      {
        q: '如何暫停配對？',
        a: '前往「我的」→「安全與隱私」→「隱私設定」，關閉「顯示個人檔案」。暫停期間你不會出現在其他人的推薦中，但現有的配對和聊天不受影響。',
      },
    ],
  },
  {
    title: '帳號管理',
    icon: '⚙️',
    items: [
      {
        q: '如何修改個人資料？',
        a: '前往「我的」頁面，點擊「編輯個人資料」即可修改暱稱、照片和自我介紹。生日和性別設定後無法更改。',
      },
      {
        q: '如何更改配對偏好？',
        a: '前往「我的」→「配對偏好設定」，可以修改期望年齡範圍、性別偏好和希望配對的縣市。',
      },
      {
        q: '如何刪除帳號？',
        a: '前往「我的」頁面最底部，點擊「刪除帳號」，輸入確認文字後即可刪除。刪除後所有資料將無法恢復。',
      },
    ],
  },
];

function Accordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left gap-3"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-text">{item.q}</span>
        <ChevronDown
          size={16}
          className={`text-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="pb-4 animate-fade-in">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
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

      <h1 className="text-2xl font-bold mb-2">
        <span className="gradient-text">常見問題與教學</span>
      </h1>
      <p className="text-sm text-text-secondary mb-8">有任何疑問？這裡應該能找到答案 😊</p>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="card">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span>{section.icon}</span>
              {section.title}
            </h2>
            <div>
              {section.items.map((item) => (
                <Accordion key={item.q} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center pb-8">
        <p className="text-sm text-text-secondary mb-3">找不到你的問題？</p>
        <a
          href="/support"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-primary transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(255, 140, 107, 0.08)',
            border: '1.5px solid rgba(255, 140, 107, 0.2)',
          }}
        >
          📮 聯絡我們
        </a>
      </div>
    </div>
  );
}
