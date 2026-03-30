'use client';

import { ArrowLeft, Shield, MapPin, Users, Clock, MessageCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tips = [
  {
    icon: MapPin,
    title: '第一次見面選公開場所',
    items: [
      '選擇人多的咖啡廳、餐廳或商場',
      '避免去對方家或偏僻地點',
      '告訴朋友或家人你的約會地點和時間',
    ],
  },
  {
    icon: Users,
    title: '保護個人資訊',
    items: [
      '不要太早分享住址、公司地址',
      '不要透露銀行帳戶或財務資訊',
      '使用 app 內聊天，不急著交換私人社群',
    ],
  },
  {
    icon: Clock,
    title: '給自己足夠時間',
    items: [
      '多聊幾天再決定見面',
      '不要因為壓力而加速關係進展',
      '相信自己的直覺，覺得不對就離開',
    ],
  },
  {
    icon: MessageCircle,
    title: '注意對話中的警訊',
    items: [
      '要求匯款或借錢 → 立即封鎖檢舉',
      '迴避視訊通話或總是找藉口',
      '過度追問私人資訊（住址、薪水）',
      '言語騷擾或不尊重你的拒絕',
    ],
  },
  {
    icon: AlertTriangle,
    title: '遇到問題怎麼辦',
    items: [
      '使用 app 內的「檢舉」功能回報可疑行為',
      '使用「封鎖」功能阻止不良用戶',
      '如有人身安全疑慮，請撥打 110',
      '聯絡我們：support@mochi-match.app',
    ],
  },
];

export default function SafetyPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh pb-12">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="返回">
            <ArrowLeft size={22} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">安全指引</span>
          </h1>
        </div>
      </div>

      <div className="px-6 space-y-4">
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255, 140, 107, 0.08), rgba(255, 107, 107, 0.05))' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center gradient-bg">
              <Shield size={20} color="white" />
            </div>
            <div>
              <p className="font-bold">你的安全最重要</p>
              <p className="text-xs text-text-secondary">認識新朋友很棒，但請務必保護好自己</p>
            </div>
          </div>
        </div>

        {tips.map((section, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 140, 107, 0.08)' }}>
                <section.icon size={16} className="text-primary" />
              </div>
              <h2 className="font-bold text-sm">{section.title}</h2>
            </div>
            <ul className="space-y-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-4 text-center">
          <p className="text-xs text-text-secondary">
            如果你或你認識的人正處於危險中，請撥打 <strong>110</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
