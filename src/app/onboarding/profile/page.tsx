'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, Camera } from 'lucide-react';

const regions = ['台北', '新北', '桃園', '台中', '台南', '高雄', '新竹', '其他'];

export default function ProfilePage() {
  const { currentUser, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();

  const [bio, setBio] = useState(currentUser?.bio || '');
  const [age, setAge] = useState(currentUser?.age || 25);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentUser?.gender || 'male');
  const [region, setRegion] = useState(currentUser?.preferences.region || '台北');
  const [ageMin, setAgeMin] = useState(currentUser?.preferences.ageMin || 20);
  const [ageMax, setAgeMax] = useState(currentUser?.preferences.ageMax || 35);
  const [genderPref, setGenderPref] = useState<string[]>(
    currentUser?.preferences.genderPreference || ['female', 'male', 'other']
  );

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const toggleGenderPref = (g: string) => {
    setGenderPref(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  const handleComplete = () => {
    updateProfile({
      bio,
      age,
      gender,
      preferences: {
        ageMin,
        ageMax,
        genderPreference: genderPref as ('male' | 'female' | 'other')[],
        region,
      },
      onboardingComplete: true,
    });
    setOnboardingStep(4);
    router.push('/home');
  };

  const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      {/* 進度條 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-text-secondary">步驟 3/3 — 個人資料</p>
        </div>
        <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-accent"
            style={{
              width: '80%',
            }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pb-20">
        {/* 頭像 */}
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center cursor-pointer bg-bg-input border border-border"
          >
            <Camera size={28} className="text-text-secondary" />
          </div>
          <p className="text-xs text-text-secondary">點擊上傳照片（Demo 模式）</p>
        </div>

        {/* 暱稱 */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">暱稱</label>
          <input type="text" value={currentUser.name} readOnly className="opacity-60" />
        </div>

        {/* 年齡 */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">年齡</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            min={18}
            max={60}
          />
        </div>

        {/* 性別 */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">性別</label>
          <div className="flex gap-3">
            {[
              { value: 'male', label: '男生 🙋‍♂️' },
              { value: 'female', label: '女生 🙋‍♀️' },
              { value: 'other', label: '其他 🌈' },
            ].map(g => (
              <button
                key={g.value}
                className={`strength-btn flex-1 ${gender === g.value ? 'active' : ''}`}
                onClick={() => setGender(g.value as 'male' | 'female' | 'other')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 地區 */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">所在地區</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* 自我介紹 */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">自我介紹</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="來段自我介紹吧！你的興趣、個性、對生活的態度..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* 配對偏好 */}
        <div className="card">
          <h3 className="font-bold mb-4">配對偏好</h3>

          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">希望找的性別</label>
            <div className="flex gap-2">
              {[
                { value: 'male', label: '男生' },
                { value: 'female', label: '女生' },
                { value: 'other', label: '不限' },
              ].map(g => (
                <button
                  key={g.value}
                  className={`strength-btn flex-1 ${genderPref.includes(g.value) ? 'active' : ''}`}
                  onClick={() => toggleGenderPref(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">年齡範圍</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={ageMin}
                onChange={(e) => setAgeMin(Number(e.target.value))}
                min={18}
                max={60}
                className="w-20 text-center"
              />
              <span className="text-text-secondary">~</span>
              <input
                type="number"
                value={ageMax}
                onChange={(e) => setAgeMax(Number(e.target.value))}
                min={18}
                max={60}
                className="w-20 text-center"
              />
              <span className="text-sm text-text-secondary">歲</span>
            </div>
          </div>
        </div>
      </div>

      {/* 完成按鈕 */}
      <div className="pt-4">
        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={handleComplete}
          disabled={!bio.trim()}
        >
          完成設定，開始配對！
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
