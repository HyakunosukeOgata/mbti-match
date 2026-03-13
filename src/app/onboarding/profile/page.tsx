'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import React from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { track } from '@/lib/analytics';
import { moderateBio } from '@/lib/moderation';

const regions = ['台北', '新北', '桃園', '台中', '台南', '高雄', '新竹', '其他'];

export default function ProfilePage() {
  const { currentUser, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();

  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [birthdate, setBirthdate] = useState('');
  const [age, setAge] = useState(currentUser?.age || 25);
  const [ageError, setAgeError] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentUser?.gender || 'male');
  const [region, setRegion] = useState(currentUser?.preferences.region || '台北');
  const [bioError, setBioError] = useState('');
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
    setGenderPref(prev => {
      if (prev.includes(g) && prev.length <= 1) return prev;
      return prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g];
    });
  };

  const MAX_PHOTOS = 6;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotos(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = () => {
    if (bio.trim()) {
      const check = moderateBio(bio);
      if (!check.allowed) {
        setBioError(check.reason || '內容不符合規範');
        setTimeout(() => setBioError(''), 3000);
        return;
      }
    }
    const validAge = Math.max(18, Math.min(60, age));
    const validAgeMin = Math.max(18, Math.min(60, ageMin));
    const validAgeMax = Math.max(validAgeMin, Math.min(60, ageMax));
    updateProfile({
      photos,
      bio,
      age: validAge,
      gender,
      preferences: {
        ageMin: validAgeMin,
        ageMax: validAgeMax,
        genderPreference: genderPref as ('male' | 'female' | 'other')[],
        region,
      },
      onboardingComplete: true,
    });
    track('onboarding_complete');
    setOnboardingStep(4);
    router.push('/home');
  };

  const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-text-secondary">👤 步驟 3/3 · 個人資料</p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: '100%' }} />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pb-20">
        {/* Photos */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">📸 照片（至少 1 張，最多 {MAX_PHOTOS} 張）</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <img src={photo} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                >✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <button
                  onClick={handleAddPhoto}
                  className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Camera size={24} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">上傳照片</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">暱稱</label>
          <input type="text" value={currentUser.name} readOnly className="opacity-60" />
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">🎂 出生日期（18+ 驗證）</label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => {
              const val = e.target.value;
              setBirthdate(val);
              setAgeError('');
              if (val) {
                const birth = new Date(val);
                const today = new Date();
                let calcAge = today.getFullYear() - birth.getFullYear();
                const monthDiff = today.getMonth() - birth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                  calcAge--;
                }
                if (calcAge < 18) {
                  setAgeError('本服務僅限 18 歲以上使用');
                  setAge(calcAge);
                } else if (calcAge > 100) {
                  setAgeError('請輸入有效的出生日期');
                  setAge(25);
                } else {
                  setAge(calcAge);
                }
              }
            }}
            max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
          />
          {ageError && (
            <p className="text-xs text-danger mt-1">{ageError}</p>
          )}
          {!ageError && birthdate && (
            <p className="text-xs text-success mt-1">✅ 年齡驗證通過（{age} 歲）</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">性別</label>
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

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">📍 所在地區</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">✍️ 自我介紹</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="說說你自己吧！興趣、個性、對生活的態度...讓別人更認識你 💜"
            rows={4}
            className="resize-none"
          />
          {bioError && (
            <p className="text-red-500 text-xs mt-1">{bioError}</p>
          )}
        </div>

        <div className="card !border-none" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(244, 63, 94, 0.03))' }}>
          <h3 className="font-bold mb-4 gradient-text">💕 配對偏好</h3>

          <div className="mb-4">
            <label className="text-sm font-medium text-text-secondary mb-2 block">希望認識</label>
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
            <label className="text-sm font-medium text-text-secondary mb-2 block">年齡範圍</label>
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

      <div className="pt-4">
        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={handleComplete}
          disabled={!bio.trim() || photos.length === 0 || !birthdate || !!ageError}
        >
          完成設定，開始配對！🚀
        </button>
      </div>
    </div>
  );
}
