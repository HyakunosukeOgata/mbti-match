'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import React from 'react';
import { LogOut, User, Sliders, Shield, ChevronRight, Camera, BarChart3, Trash2 } from 'lucide-react';
import { track } from '@/lib/analytics';
import { getAnalyticsSummary } from '@/lib/analytics';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/components/ConsentBanner';

const regions = ['台北', '新北', '桃園', '台中', '台南', '高雄', '新竹', '其他'];

export default function SettingsPage() {
  const { currentUser, updateProfile, logout } = useApp();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
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
    } else {
      track('page_view', { page: 'settings' });
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const toggleGenderPref = (g: string) => {
    setGenderPref(prev => {
      if (prev.includes(g) && prev.length <= 1) return prev; // 至少保留一個
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
      showToast('❌ 請選擇圖片檔案');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('❌ 照片不可超過 2MB');
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

  const handleSave = () => {
    const clampedMin = Math.max(18, Math.min(60, Math.min(ageMin, ageMax)));
    const clampedMax = Math.max(clampedMin, Math.min(60, Math.max(ageMin, ageMax)));
    setAgeMin(clampedMin);
    setAgeMax(clampedMax);
    updateProfile({
      photos,
      bio,
      preferences: {
        ageMin: clampedMin,
        ageMax: clampedMax,
        genderPreference: genderPref as ('male' | 'female' | 'other')[],
        region,
      },
    });
    setEditMode(false);
    showToast('✅ 已儲存');
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    // Use window.location for reliable redirect after state clear
    window.location.href = '/';
  };

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold">
          <span className="gradient-text">我的</span> ⚙️
        </h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Profile card */}
        <div className="card !border-none overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(244, 63, 94, 0.04))' }}>
          <div className="flex items-center gap-4 mb-4">
            {currentUser.photos.length > 0 ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}>
                <img src={currentUser.photos[0]} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white gradient-bg" style={{ boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{currentUser.name}</p>
              <div className="flex items-center gap-2 mt-1">
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
                ✏️ 編輯個人資料
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Photo grid */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">📸 照片（最多 {MAX_PHOTOS} 張）</label>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={photo} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center"
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
                        className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <Camera size={18} className="text-text-secondary" />
                        <span className="text-[10px] text-text-secondary">上傳</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">自我介紹</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
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

        {/* Preferences */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={16} className="text-primary" />
            <h3 className="font-bold">💕 配對偏好</h3>
          </div>

          <div className="space-y-4">
            <div>
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

            <div>
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
              <label className="text-sm font-medium text-text-secondary mb-2 block">📍 地區</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button className="btn-primary text-sm" onClick={() => { handleSave(); }}>
              儲存偏好
            </button>
          </div>
        </div>

        {/* Safety */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <h3 className="font-bold">🔒 安全與隱私</h3>
          </div>
          <div className="space-y-1">
            {['封鎖名單', '隱私設定', '身份驗證'].map(label => (
              <button
                key={label}
                className="w-full flex items-center justify-between py-3 px-2 text-sm text-text-secondary hover:text-text rounded-xl hover:bg-bg-input transition-colors"
                onClick={() => showToast(`${label}功能即將上線，敬請期待 ✨`)}
              >
                <span>{label}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Analytics */}
        {(() => {
          const consent = getAnalyticsConsent();
          const summary = consent ? getAnalyticsSummary() : null;
          return (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" />
                  <h3 className="font-bold">📊 使用統計</h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-text-secondary">{consent ? '已開啟' : '已關閉'}</span>
                  <input
                    type="checkbox"
                    checked={consent === true}
                    onChange={(e) => { setAnalyticsConsent(e.target.checked); router.refresh(); }}
                    className="w-4 h-4 accent-purple-600"
                  />
                </label>
              </div>
              {summary ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(124, 58, 237, 0.06)' }}>
                      <p className="text-xl font-extrabold text-primary">{summary.today.likes}</p>
                      <p className="text-xs text-text-secondary mt-0.5">今日喜歡</p>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
                      <p className="text-xl font-extrabold text-success">{summary.today.matches}</p>
                      <p className="text-xs text-text-secondary mt-0.5">今日配對</p>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(236, 72, 153, 0.06)' }}>
                      <p className="text-xl font-extrabold" style={{ color: '#EC4899' }}>{summary.today.messages}</p>
                      <p className="text-xs text-text-secondary mt-0.5">今日訊息</p>
                    </div>
                    <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.06)' }}>
                      <p className="text-xl font-extrabold" style={{ color: '#F59E0B' }}>{summary.week.pageViews}</p>
                      <p className="text-xs text-text-secondary mt-0.5">本週瀏覽</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <p className="text-xs text-text-secondary">
                      本週互動：{summary.week.likes} 喜歡 · {summary.week.skips} 跳過 · {summary.week.matches} 配對
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-text-secondary">開啟統計以追蹤你的使用數據（資料僅儲存在本機）</p>
              )}
            </div>
          );
        })()}

        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-danger text-sm font-medium rounded-2xl hover:bg-red-50 transition-colors"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          登出
        </button>

        {/* Delete Account */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-2xl transition-colors opacity-60 hover:opacity-100"
          style={{ color: '#991B1B' }}
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={16} />
          刪除帳號
        </button>

        {/* Legal links */}
        <div className="flex justify-center gap-4 pt-2 pb-4">
          <a href="/privacy" className="text-xs text-text-secondary hover:text-primary transition-colors">隱私權政策</a>
          <span className="text-xs text-border">·</span>
          <a href="/terms" className="text-xs text-text-secondary hover:text-primary transition-colors">服務條款</a>
          <span className="text-xs text-border">·</span>
          <a href="/support" className="text-xs text-text-secondary hover:text-primary transition-colors">聯絡我們</a>
        </div>

        {/* Logout confirm modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="mx-8 p-6 rounded-2xl bg-white shadow-xl animate-scale-in max-w-sm w-full">
              <p className="text-center font-bold mb-2">確定要登出嗎？</p>
              <p className="text-center text-sm text-text-secondary mb-5">登出後需要重新登入</p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setShowLogoutConfirm(false)}>取消</button>
                <button className="btn-primary flex-1 text-sm !bg-red-500" onClick={confirmLogout}>確認登出</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete account confirm modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="mx-8 p-6 rounded-2xl bg-white shadow-xl animate-scale-in max-w-sm w-full">
              <p className="text-center font-bold mb-2 text-danger">⚠️ 刪除帳號</p>
              <p className="text-center text-sm text-text-secondary mb-3">
                此操作無法復原。你的所有資料（個人資料、配對紀錄、聊天訊息）將被永久刪除。
              </p>
              <p className="text-center text-xs text-text-secondary mb-3">
                請輸入「<strong>刪除</strong>」來確認
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="輸入 刪除"
                className="mb-4 text-center"
              />
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>取消</button>
                <button
                  className="btn-primary flex-1 text-sm !bg-red-600"
                  disabled={deleteInput !== '刪除'}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput('');
                    // Delete all user data
                    logout();
                    window.location.href = '/';
                  }}
                >
                  永久刪除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
              {toast}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
