'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import { LogOut, User, Sliders, Shield, ChevronRight } from 'lucide-react';

const regions = ['台北', '新北', '桃園', '台中', '台南', '高雄', '新竹', '其他'];

export default function SettingsPage() {
  const { currentUser, updateProfile, logout } = useApp();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [ageMin, setAgeMin] = useState(currentUser?.preferences.ageMin || 20);
  const [ageMax, setAgeMax] = useState(currentUser?.preferences.ageMax || 35);
  const [genderPref, setGenderPref] = useState<string[]>(
    currentUser?.preferences.genderPreference || []
  );
  const [region, setRegion] = useState(currentUser?.preferences.region || '台北');

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

  const handleSave = () => {
    updateProfile({
      bio,
      preferences: {
        ageMin,
        ageMax,
        genderPreference: genderPref as ('male' | 'female' | 'other')[],
        region,
      },
    });
    setEditMode(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold">設定</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* 個人資料卡片 */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-primary"
            >
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg">{currentUser.name}</p>
              <div className="flex items-center gap-2">
                <span className="mbti-badge">{currentUser.mbtiCode}</span>
                <span className="text-sm text-text-secondary">{currentUser.age}歲</span>
              </div>
            </div>
          </div>

          {!editMode ? (
            <>
              <p className="text-sm text-text-secondary mb-3">{currentUser.bio || '尚未填寫自我介紹'}</p>
              <button
                className="btn-secondary text-sm w-full"
                onClick={() => setEditMode(true)}
              >
                編輯個人資料
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">自我介紹</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setEditMode(false)}>
                  取消
                </button>
                <button className="btn-primary flex-1 text-sm" onClick={handleSave}>
                  儲存
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 配對偏好 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={16} className="text-text-secondary" />
            <h3 className="font-bold">配對偏好</h3>
          </div>

          <div className="space-y-4">
            <div>
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

            <div>
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

            <div>
              <label className="text-sm text-text-secondary mb-2 block">地區</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button className="btn-primary text-sm" onClick={handleSave}>
              儲存偏好
            </button>
          </div>
        </div>

        {/* 安全 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-text-secondary" />
            <h3 className="font-bold">安全與隱私</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between py-2 text-sm text-text-secondary hover:text-text">
              <span>封鎖名單</span>
              <ChevronRight size={16} />
            </button>
            <button className="w-full flex items-center justify-between py-2 text-sm text-text-secondary hover:text-text">
              <span>隱私設定</span>
              <ChevronRight size={16} />
            </button>
            <button className="w-full flex items-center justify-between py-2 text-sm text-text-secondary hover:text-text">
              <span>身份驗證</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 登出 */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-danger text-sm font-medium"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          登出
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
