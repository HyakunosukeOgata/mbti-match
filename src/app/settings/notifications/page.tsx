'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

interface NotifPrefs {
  matches: boolean;
  messages: boolean;
  likes: boolean;
  weekly: boolean;
  system: boolean;
}

const defaultPrefs: NotifPrefs = {
  matches: true,
  messages: true,
  likes: true,
  weekly: true,
  system: true,
};

const labels: Record<keyof NotifPrefs, { title: string; desc: string }> = {
  matches: { title: '新配對', desc: '有人跟你配對成功時通知你' },
  messages: { title: '新訊息', desc: '收到聊天訊息時通知你' },
  likes: { title: '誰喜歡我', desc: '有人對你按喜歡時通知你' },
  weekly: { title: '每週報告', desc: '每週配對數據與建議' },
  system: { title: '系統通知', desc: '重要更新與公告' },
};

export default function NotificationPrefsPage() {
  const { authReady, currentUser, updateProfile } = useApp();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) { router.replace('/'); return; }
    const saved = currentUser.preferences?.notificationPrefs;
    if (saved) {
      setPrefs({ ...defaultPrefs, ...saved });
    }
  }, [authReady, currentUser, router]);

  const toggle = async (key: keyof NotifPrefs) => {
    const prev = { ...prefs };
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await updateProfile({
        preferences: { ...currentUser!.preferences, notificationPrefs: next },
      });
      setToast('✅ 已更新');
    } catch {
      setPrefs(prev);
      setToast('❌ 更新失敗');
    }
    setTimeout(() => setToast(''), 1500);
  };

  if (!authReady || !currentUser) return null;

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold">通知設定</h1>
        </div>
      </div>

      <div className="px-6">
        <div className="card space-y-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 140, 107, 0.08)' }}>
              <Bell size={15} className="text-primary" />
            </div>
            <h2 className="font-bold">🔔 通知類型</h2>
          </div>
          {(Object.keys(labels) as (keyof NotifPrefs)[]).map((key, i) => (
            <div key={key} className={`flex items-center justify-between py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
              <div>
                <p className="text-sm font-medium">{labels[key].title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{labels[key].desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                role="switch"
                aria-checked={prefs[key]}
                aria-label={labels[key].title}
                className="p-2 -m-2"
              >
                <div className={`w-12 h-7 rounded-full transition-colors relative ${prefs[key] ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-secondary text-center mt-4 px-4">
          💡 你也可以在 iOS 系統「設定 → 通知 → Mochi」中管理推播通知
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
