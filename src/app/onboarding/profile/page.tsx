'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import React from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { track } from '@/lib/analytics';
import { moderateBio } from '@/lib/moderation';
import { TAIWAN_CITIES } from '@/lib/types';

export default function ProfilePage() {
  const { currentUser, updateProfile, setOnboardingStep } = useApp();
  const router = useRouter();

  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [nickname, setNickname] = useState(currentUser?.name || '');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [birthMonth, setBirthMonth] = useState<number | ''>('');
  const [birthDay, setBirthDay] = useState<number | ''>('');
  const [age, setAge] = useState(currentUser?.age || 25);
  const [ageError, setAgeError] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentUser?.gender || 'male');
  const [region, setRegion] = useState(currentUser?.preferences.region || '');
  const [bioError, setBioError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [ageMin, setAgeMin] = useState(currentUser?.preferences.ageMin || 20);
  const [ageMax, setAgeMax] = useState(currentUser?.preferences.ageMax || 35);
  const [genderPref, setGenderPref] = useState<string[]>(
    currentUser?.preferences.genderPreference || ['female', 'male', 'other']
  );
  const [preferredRegions, setPreferredRegions] = useState<string[]>(
    currentUser?.preferences.preferredRegions || []
  );

  // Calculate age whenever birth fields change
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      const today = new Date();
      let calcAge = today.getFullYear() - birthYear;
      const monthDiff = today.getMonth() + 1 - birthMonth;
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
        calcAge--;
      }
      if (calcAge < 18) {
        setAgeError('本服務僅限 18 歲以上使用');
        setAge(calcAge);
      } else if (calcAge > 100) {
        setAgeError('請輸入有效的出生日期');
        setAge(25);
      } else {
        setAgeError('');
        setAge(calcAge);
      }
    } else {
      setAgeError('');
    }
  }, [birthYear, birthMonth, birthDay]);

  const isBirthdateComplete = birthYear !== '' && birthMonth !== '' && birthDay !== '';

  // Generate year/month/day options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = birthYear && birthMonth
    ? new Date(birthYear as number, birthMonth as number, 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
    if (!file.type.startsWith('image/')) {
      setPhotoError('❌ 請選擇圖片檔案');
      setTimeout(() => setPhotoError(''), 3000);
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('❌ 照片不可超過 2MB');
      setTimeout(() => setPhotoError(''), 3000);
      e.target.value = '';
      return;
    }
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
      name: nickname.trim() || currentUser.name,
      photos,
      bio,
      age: validAge,
      gender,
      preferences: {
        ageMin: validAgeMin,
        ageMax: validAgeMax,
        genderPreference: genderPref as ('male' | 'female' | 'other')[],
        region,
        preferredRegions: preferredRegions.length > 0 ? preferredRegions : undefined,
      },
      onboardingComplete: true,
    });
    track('onboarding_complete');
    setOnboardingStep(4);
    setShowCelebration(true);
  };

  const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

  if (showCelebration) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} className="absolute text-2xl" style={{
              top: '-10%',
              left: `${10 + i * 12}%`,
              animation: `confetti-fall ${3 + i * 0.4}s ease-in ${i * 0.2}s infinite`,
            }}>
              {['🎉','✨','💜','🎊','💫','🌟','🎈','💜'][i]}
            </div>
          ))}
        </div>

        <div className="text-center animate-bounce-in relative z-10">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #E8842C, #FF6B6B)', boxShadow: '0 0 50px rgba(232, 132, 44, 0.4)' }}>
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="shimmer-text">歡迎加入 Mochi！</span>
          </h1>
          <p className="text-text-secondary text-sm mb-2">
            你的個人資料已建立完成
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-slide-up" style={{ background: 'rgba(232, 132, 44, 0.08)', animationDelay: '0.3s' }}>
            <span className="mbti-badge">{currentUser.mbtiCode}</span>
            <span className="text-sm font-medium">{nickname || currentUser.name}</span>
          </div>
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <button
              className="btn-primary flex items-center justify-center gap-2"
              onClick={() => router.push('/home')}
            >
              ✨ 開始探索配對
            </button>
            <p className="text-xs text-text-secondary opacity-60">
              每天為你推薦最合適的人選
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                  className="absolute -top-1 -right-1 w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                  aria-label={`刪除照片 ${idx + 1}`}
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
          {photoError && (
            <p className="text-red-500 text-xs mt-2">{photoError}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">暱稱</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="你的暱稱"
            maxLength={20}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">🎂 出生日期（18+ 驗證）</label>
          <div className="flex gap-2">
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : '')}
              className="flex-[1.2]"
            >
              <option value="">年</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value ? Number(e.target.value) : '')}
              className="flex-1"
            >
              <option value="">月</option>
              {months.map(m => <option key={m} value={m}>{m} 月</option>)}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value ? Number(e.target.value) : '')}
              className="flex-1"
            >
              <option value="">日</option>
              {days.map(d => <option key={d} value={d}>{d} 日</option>)}
            </select>
          </div>
          {ageError && (
            <p className="text-xs text-danger mt-1">{ageError}</p>
          )}
          {!ageError && isBirthdateComplete && (
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
          <label className="text-sm font-medium text-text-secondary mb-2 block">📍 所在縣市</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">請選擇縣市</option>
            {TAIWAN_CITIES.map(r => (
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

        <div className="card !border-none" style={{ background: 'linear-gradient(135deg, rgba(232, 132, 44, 0.04), rgba(255, 107, 107, 0.03))' }}>
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

          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">📍 希望配對的縣市（可複選）</label>
            <div className="flex flex-wrap gap-2">
              {TAIWAN_CITIES.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`strength-btn !py-2.5 !px-3 !text-xs ${preferredRegions.includes(r) ? 'active' : ''}`}
                  onClick={() => setPreferredRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                >
                  {r}
                </button>
              ))}
            </div>
            {preferredRegions.length > 0 && (
              <p className="text-xs text-primary mt-1.5">已選 {preferredRegions.length} 個縣市</p>
            )}
            <p className="text-xs text-text-secondary mt-1.5 opacity-60">不選 = 不限地區</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          className="btn-primary flex items-center justify-center gap-2"
          onClick={handleComplete}
          disabled={!bio.trim() || photos.length === 0 || !isBirthdateComplete || !!ageError || !region}
        >
          完成設定，開始配對！🚀
        </button>
      </div>
    </div>
  );
}
