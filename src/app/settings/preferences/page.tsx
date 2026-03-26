'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { track } from '@/lib/analytics';
import { TAIWAN_CITIES } from '@/lib/types';

export default function PreferencesPage() {
  const { currentUser, authReady, updateProfile } = useApp();
  const router = useRouter();

  const [ageMin, setAgeMin] = useState(currentUser?.preferences.ageMin || 20);
  const [ageMax, setAgeMax] = useState(currentUser?.preferences.ageMax || 35);
  const [genderPref, setGenderPref] = useState<string[]>(
    currentUser?.preferences.genderPreference || []
  );
  const [region, setRegion] = useState(currentUser?.preferences.region || '台北市');
  const [preferredRegions, setPreferredRegions] = useState<string[]>(
    currentUser?.preferences.preferredRegions || []
  );
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setAgeMin(currentUser.preferences.ageMin || 20);
    setAgeMax(currentUser.preferences.ageMax || 35);
    setGenderPref(currentUser.preferences.genderPreference || []);
    setRegion(currentUser.preferences.region || '台北市');
    setPreferredRegions(currentUser.preferences.preferredRegions || []);
  }, [currentUser]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
    } else if (!currentUser.onboardingComplete) {
      router.replace('/onboarding/ai-chat');
    } else {
      track('page_view', { page: 'preferences' });
    }
  }, [authReady, currentUser, router]);

  if (!authReady || !currentUser) return null;

  const toggleGenderPref = (g: string) => {
    setGenderPref(prev => {
      if (prev.includes(g) && prev.length <= 1) return prev;
      return prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g];
    });
  };

  const handleSave = async () => {
    const clampedMin = Math.max(18, Math.min(60, Math.min(ageMin, ageMax)));
    const clampedMax = Math.max(clampedMin, Math.min(60, Math.max(ageMin, ageMax)));
    setAgeMin(clampedMin);
    setAgeMax(clampedMax);
    await updateProfile({
      preferences: {
        ageMin: clampedMin,
        ageMax: clampedMax,
        genderPreference: genderPref as ('male' | 'female' | 'other')[],
        region,
        preferredRegions: preferredRegions.length > 0 ? preferredRegions : undefined,
      },
    });
    setToast('✅ 已儲存');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="text-text-secondary hover:text-primary p-2 -ml-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="返回">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-lg flex items-center gap-2">
          <Heart size={18} className="text-primary" />
          配對偏好
        </h1>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Gender preference */}
        <div>
          <label className="text-sm font-semibold text-text mb-3 block">希望認識</label>
          <div className="flex gap-3">
            {[
              { value: 'male', label: '男生 🙋‍♂️' },
              { value: 'female', label: '女生 🙋‍♀️' },
              { value: 'other', label: '不限 🌈' },
            ].map(g => (
              <button
                key={g.value}
                className={`strength-btn flex-1 !py-3 ${genderPref.includes(g.value) ? 'active' : ''}`}
                onClick={() => toggleGenderPref(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-2 opacity-60">可複選</p>
        </div>

        {/* Age range */}
        <div>
          <label className="text-sm font-semibold text-text mb-3 block">年齡範圍</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-text-secondary mb-1 block">最小</label>
              <input
                type="number"
                value={ageMin}
                onChange={(e) => setAgeMin(Number(e.target.value))}
                min={18}
                max={60}
                className="text-center text-lg font-bold"
              />
            </div>
            <span className="text-text-secondary text-2xl mt-5">~</span>
            <div className="flex-1">
              <label className="text-xs text-text-secondary mb-1 block">最大</label>
              <input
                type="number"
                value={ageMax}
                onChange={(e) => setAgeMax(Number(e.target.value))}
                min={18}
                max={60}
                className="text-center text-lg font-bold"
              />
            </div>
            <span className="text-sm text-text-secondary mt-5">歲</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-text mb-3 block">📍 希望配對的縣市</label>
          <div className="grid grid-cols-3 gap-2">
            {TAIWAN_CITIES.map(r => {
              const selected = preferredRegions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPreferredRegions(prev => selected ? prev.filter(x => x !== r) : [...prev, r])}
                  className="py-2 px-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: selected ? 'var(--primary)' : 'var(--bg-input)',
                    color: selected ? '#fff' : 'var(--text)',
                    border: selected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {preferredRegions.length > 0 && (
            <p className="text-xs text-primary mt-2">已選 {preferredRegions.length} 個縣市</p>
          )}
          <p className="text-xs text-text-secondary mt-1 opacity-60">不選 = 不限地區</p>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255, 140, 107, 0.05)' }}>
          <p className="text-xs text-text-secondary leading-relaxed">
            💡 調整偏好後，系統會在下一次推薦時根據新設定為你配對。目前的配對和聊天不受影響。
          </p>
        </div>
      </div>

      {/* Save button fixed at bottom */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button className="btn-primary text-sm" onClick={handleSave}>
          儲存偏好
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2" style={{ zIndex: 200 }}>
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium animate-slide-up" style={{ background: 'rgba(30,30,30,0.9)' }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
