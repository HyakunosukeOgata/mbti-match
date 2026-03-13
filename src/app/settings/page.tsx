'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import React from 'react';
import { LogOut, User, Sliders, Shield, ChevronRight, Camera, BarChart3, Trash2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { track } from '@/lib/analytics';
import { getAnalyticsSummary } from '@/lib/analytics';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/components/ConsentBanner';
import { TAIWAN_CITIES } from '@/lib/types';

export default function SettingsPage() {
  const { currentUser, updateProfile, logout } = useApp();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [editName, setEditName] = useState(currentUser?.name || '');

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    } else {
      track('page_view', { page: 'settings' });
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

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

  const handleSave = () => {
    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 20) {
      showToast('❗ 昵稱需為 1-20 字');
      return;
    }
    updateProfile({
      name: trimmedName,
      photos,
      bio,
    });
    setEditMode(false);
    showToast('✅ 已儲存');
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [toast, setToast] = useState('');
  const [profileVisible, setProfileVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('mochi_profile_visible') !== 'false';
  });
  const [hideAge, setHideAge] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mochi_hide_age') === 'true';
  });
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [showVerifyPanel, setShowVerifyPanel] = useState(false);

  // Get blocked users from localStorage
  const getBlockedUsers = () => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('mochi_blocked_users');
    return raw ? JSON.parse(raw) : [];
  };
  const getBlockedNames = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem('mochi_blocked_names');
    return raw ? JSON.parse(raw) : {};
  };
  const [blockedUsers, setBlockedUsers] = useState<string[]>(getBlockedUsers);
  const [blockedNames] = useState<Record<string, string>>(getBlockedNames);

  const unblockUser = (userId: string) => {
    const updated = blockedUsers.filter(id => id !== userId);
    setBlockedUsers(updated);
    localStorage.setItem('mochi_blocked_users', JSON.stringify(updated));
    showToast('✅ 已解除封鎖');
  };

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
      <div className="px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold">
          <span className="gradient-text">我的</span>
        </h1>
      </div>

      <div className="px-6 space-y-5">
        {/* Profile card */}
        <div className="card !border-none overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(232, 132, 44, 0.08), rgba(255, 107, 107, 0.05))' }}>
          {/* Decorative gradient orb */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' }} />
          <div className="relative flex items-center gap-4 mb-4">
            {currentUser.photos.length > 0 ? (
              <div className="w-18 h-18 rounded-2xl overflow-hidden ring-2 ring-primary/20 ring-offset-2" style={{ boxShadow: '0 4px 20px rgba(232, 132, 44, 0.25)', width: 72, height: 72 }}>
                <img src={currentUser.photos[0]} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-center justify-center text-2xl font-bold text-white gradient-bg ring-2 ring-primary/20 ring-offset-2" style={{ boxShadow: '0 4px 20px rgba(232, 132, 44, 0.25)', width: 72, height: 72, borderRadius: 16 }}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{currentUser.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="mbti-badge">{currentUser.mbtiCode}</span>
                <span className="text-sm text-text-secondary">{currentUser.age}歲</span>
              </div>
            </div>
          </div>

          {!editMode ? (
            <>
              {currentUser.bio ? (
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">{currentUser.bio}</p>
              ) : (
                <p className="text-sm text-text-secondary/60 mb-4 italic">尚未填寫自我介紹</p>
              )}
              <button
                className="btn-secondary text-sm w-full"
                onClick={() => {
                  setEditName(currentUser.name);
                  setPhotos(currentUser.photos);
                  setBio(currentUser.bio);
                  setEditMode(true);
                }}
              >
                ✏️ 編輯個人資料
              </button>
            </>
          ) : (
            <div className="space-y-5">
              {/* Name edit */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wider">暱稱</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={20}
                  placeholder="你的暱稱"
                />
                <p className="text-xs text-text-secondary/50 mt-1 text-right">{editName.length}/20</p>
              </div>
              {/* Non-editable fields */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wider">🔒 生日</label>
                  <div className="px-4 py-3 rounded-xl bg-bg-input text-text-secondary text-sm opacity-50 cursor-not-allowed select-none">{currentUser.age}歲</div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wider">🔒 性別</label>
                  <div className="px-4 py-3 rounded-xl bg-bg-input text-text-secondary text-sm opacity-50 cursor-not-allowed select-none">{currentUser.gender === 'male' ? '男' : currentUser.gender === 'female' ? '女' : '其他'}</div>
                </div>
              </div>
              {/* Photo grid */}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-2 block uppercase tracking-wider">📸 照片（{photos.length}/{MAX_PHOTOS}）</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={photo} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute -top-1 -right-1 w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-red-500 transition-all"
                        aria-label={`刪除照片 ${idx + 1}`}
                      >✕</button>
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 text-[11px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full">主照片</span>
                      )}
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
                        className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <Camera size={20} className="text-text-secondary" />
                        <span className="text-[11px] text-text-secondary">上傳</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wider">自我介紹</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="寫些什麼讓別人認識你吧..."
                  className="resize-none"
                />
                <p className="text-xs text-text-secondary/50 mt-1 text-right">{bio.length}/500</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setPhotos(currentUser.photos); setBio(currentUser.bio); setEditName(currentUser.name); setEditMode(false); }}>
                  取消
                </button>
                <button className="btn-primary flex-1 text-sm" onClick={handleSave}>
                  💾 儲存變更
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preferences - link to separate page */}
        <button
          className="card w-full text-left group"
          onClick={() => router.push('/settings/preferences')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232, 132, 44, 0.08)' }}>
                <Sliders size={15} className="text-primary" />
              </div>
              <h3 className="font-bold">💕 配對偏好</h3>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="text-xs">{currentUser.preferences.region} · {currentUser.preferences.ageMin}-{currentUser.preferences.ageMax}歲</span>
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>

        {/* Safety */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232, 132, 44, 0.08)' }}>
              <Shield size={15} className="text-primary" />
            </div>
            <h3 className="font-bold">🔒 安全與隱私</h3>
          </div>
          <div className="space-y-0.5">
            <button
              className="w-full flex items-center justify-between py-3 px-3 text-sm hover:text-text rounded-xl hover:bg-bg-input transition-colors group"
              onClick={() => setShowBlockedList(true)}
            >
              <div className="flex items-center gap-3">
                <XCircle size={16} className="text-text-secondary/60" />
                <span>封鎖名單</span>
              </div>
              <div className="flex items-center gap-2">
                {blockedUsers.length > 0 && (
                  <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-medium">{blockedUsers.length}</span>
                )}
                <ChevronRight size={16} className="text-text-secondary/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
            <button
              className="w-full flex items-center justify-between py-3 px-3 text-sm hover:text-text rounded-xl hover:bg-bg-input transition-colors group"
              onClick={() => setShowPrivacyPanel(true)}
            >
              <div className="flex items-center gap-3">
                {profileVisible ? <Eye size={16} className="text-text-secondary/60" /> : <EyeOff size={16} className="text-warning" />}
                <span>隱私設定</span>
              </div>
              <div className="flex items-center gap-2">
                {!profileVisible && <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">已暫停</span>}
                <ChevronRight size={16} className="text-text-secondary/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
            <button
              className="w-full flex items-center justify-between py-3 px-3 text-sm hover:text-text rounded-xl hover:bg-bg-input transition-colors group"
              onClick={() => setShowVerifyPanel(true)}
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-text-secondary/60" />
                <span>身份驗證</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">即將開放</span>
                <ChevronRight size={16} className="text-text-secondary/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Analytics */}
        {(() => {
          const consent = getAnalyticsConsent();
          const summary = consent ? getAnalyticsSummary() : null;
          return (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232, 132, 44, 0.08)' }}>
                    <BarChart3 size={15} className="text-primary" />
                  </div>
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
                    <div className="p-3.5 rounded-xl" style={{ background: 'rgba(232, 132, 44, 0.06)' }}>
                      <p className="text-2xl font-bold text-primary leading-none">{summary.today.likes}</p>
                      <p className="text-[11px] text-text-secondary mt-1.5 font-medium">💜 今日喜歡</p>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
                      <p className="text-2xl font-bold text-success leading-none">{summary.today.matches}</p>
                      <p className="text-[11px] text-text-secondary mt-1.5 font-medium">✨ 今日配對</p>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ background: 'rgba(236, 72, 153, 0.06)' }}>
                      <p className="text-2xl font-bold leading-none" style={{ color: '#F4A261' }}>{summary.today.messages}</p>
                      <p className="text-[11px] text-text-secondary mt-1.5 font-medium">💬 今日訊息</p>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.06)' }}>
                      <p className="text-2xl font-bold leading-none" style={{ color: '#F59E0B' }}>{summary.week.pageViews}</p>
                      <p className="text-[11px] text-text-secondary mt-1.5 font-medium">👀 本週瀏覽</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex justify-around text-center">
                      <div>
                        <p className="text-sm font-bold">{summary.week.likes}</p>
                        <p className="text-[11px] text-text-secondary mt-0.5">週喜歡</p>
                      </div>
                      <div className="w-px bg-border" />
                      <div>
                        <p className="text-sm font-bold">{summary.week.skips}</p>
                        <p className="text-[11px] text-text-secondary mt-0.5">週跳過</p>
                      </div>
                      <div className="w-px bg-border" />
                      <div>
                        <p className="text-sm font-bold">{summary.week.matches}</p>
                        <p className="text-[11px] text-text-secondary mt-0.5">週配對</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-text-secondary">開啟統計以追蹤你的使用數據（資料僅儲存在本機）</p>
              )}
            </div>
          );
        })()}

        {/* Logout & Danger zone */}
        <div className="pt-2">
          <button
            className="w-full flex items-center justify-center gap-2 py-3.5 text-text-secondary text-sm font-medium rounded-2xl border border-border hover:bg-bg-input hover:text-text transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            登出
          </button>
        </div>

        {/* Delete Account - visually de-emphasized, danger on hover */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-xl transition-all text-text-secondary/40 hover:text-danger hover:bg-danger/5"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={13} />
          刪除帳號
        </button>

        {/* Legal links */}
        <div className="flex justify-center gap-4 pt-4 pb-6">
          <a href="/privacy" className="text-xs text-text-secondary hover:text-primary transition-colors">隱私權政策</a>
          <span className="text-xs text-border">·</span>
          <a href="/terms" className="text-xs text-text-secondary hover:text-primary transition-colors">服務條款</a>
          <span className="text-xs text-border">·</span>
          <a href="/support" className="text-xs text-text-secondary hover:text-primary transition-colors">聯絡我們</a>
        </div>

        {/* Blocked list panel */}
        {showBlockedList && (
          <div className="fixed inset-0 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setShowBlockedList(false)}>
            <div className="w-full max-w-lg rounded-t-3xl shadow-xl animate-slide-up max-h-[70vh] flex flex-col" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-bold text-lg">🚫 封鎖名單</h3>
                <button onClick={() => setShowBlockedList(false)} className="text-text-secondary hover:text-text p-2 rounded-xl transition-colors">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {blockedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-green-500" />
                    </div>
                    <p className="text-text-secondary text-sm">沒有封鎖任何人</p>
                    <p className="text-text-secondary text-xs mt-1 opacity-60">你可以在聊天中封鎖不適當的用戶</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((userId: string, idx: number) => {
                      const displayName = blockedNames[userId] || userId;
                      return (
                        <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-2xl bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{displayName}</span>
                          </div>
                          <button
                            onClick={() => unblockUser(userId)}
                            className="text-xs text-primary font-medium px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors"
                          >
                            解除封鎖
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Privacy settings panel */}
        {showPrivacyPanel && (
          <div className="fixed inset-0 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setShowPrivacyPanel(false)}>
            <div className="w-full max-w-lg rounded-t-3xl shadow-xl animate-slide-up" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-bold text-lg">🔒 隱私設定</h3>
                <button onClick={() => setShowPrivacyPanel(false)} className="text-text-secondary hover:text-text p-2 rounded-xl transition-colors">✕</button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">個人檔案可見</p>
                    <p className="text-xs text-text-secondary mt-0.5">關閉後不會出現在他人的推薦中</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !profileVisible;
                      setProfileVisible(next);
                      localStorage.setItem('mochi_profile_visible', String(next));
                      showToast(next ? '✅ 已恢復顯示' : '⏸️ 已隱藏檔案');
                    }}
                    role="switch"
                    aria-checked={profileVisible}
                    aria-label="個人檔案可見"
                    className={`w-12 h-7 min-w-[48px] min-h-[44px] rounded-full transition-colors relative flex items-center ${profileVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow transition-transform ${profileVisible ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">隱藏年齡</p>
                    <p className="text-xs text-text-secondary mt-0.5">他人將看不到你的年齡</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !hideAge;
                      setHideAge(next);
                      localStorage.setItem('mochi_hide_age', String(next));
                      showToast(next ? '🙈 已隱藏年齡' : '✅ 已顯示年齡');
                    }}
                    role="switch"
                    aria-checked={hideAge}
                    aria-label="隱藏年齡"
                    className={`w-12 h-7 min-w-[48px] min-h-[44px] rounded-full transition-colors relative flex items-center ${hideAge ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow transition-transform ${hideAge ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-text-secondary">
                    💡 暫停檔案後，你的現有配對和聊天不會受影響，只是不會出現在新的推薦中。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification panel */}
        {showVerifyPanel && (
          <div className="fixed inset-0 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setShowVerifyPanel(false)}>
            <div className="w-full max-w-lg rounded-t-3xl shadow-xl animate-slide-up" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-bold text-lg">✅ 身份驗證</h3>
                <button onClick={() => setShowVerifyPanel(false)} className="text-text-secondary hover:text-text p-2 rounded-xl transition-colors">✕</button>
              </div>
              <div className="px-6 py-5">
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Shield size={40} className="text-blue-400" />
                  </div>
                  <p className="font-bold text-lg mb-1">即將開放</p>
                  <p className="text-sm text-text-secondary">身份驗證功能正在開發中</p>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                    <Shield size={18} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Email 驗證</p>
                      <p className="text-xs text-text-secondary">確認 email 所有權</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                    <Shield size={18} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-secondary">照片驗證</p>
                      <p className="text-xs text-text-secondary">確認為本人照片</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                    <Shield size={18} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-secondary">進階驗證（選填）</p>
                      <p className="text-xs text-text-secondary">提供身分證件以獲得藍勾標記</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-secondary text-center mt-5 opacity-60">
                  我們正在開發安全驗證系統，敲請期待 🙏
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logout confirm modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setShowLogoutConfirm(false)}>
            <div className="mx-8 p-6 rounded-2xl shadow-xl animate-scale-in max-w-sm w-full" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-warning" />
              </div>
              <p className="text-center font-bold mb-1.5">確定要登出嗎？</p>
              <p className="text-center text-sm text-text-secondary mb-5">登出後需要重新登入</p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm" onClick={() => setShowLogoutConfirm(false)}>取消</button>
                <button className="btn-primary flex-1 text-sm" style={{ background: 'var(--warning)', boxShadow: '0 4px 15px rgba(178, 125, 0, 0.3)' }} onClick={confirmLogout}>確認登出</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete account confirm modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 200 }} onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>
            <div className="mx-8 p-6 rounded-2xl shadow-xl animate-scale-in max-w-sm w-full" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-danger" />
              </div>
              <p className="text-center font-bold mb-1.5 text-danger">刪除帳號</p>
              <p className="text-center text-sm text-text-secondary mb-4 leading-relaxed">
                此操作<strong className="text-danger">無法復原</strong>。你的所有資料將被永久刪除。
              </p>
              <p className="text-center text-xs text-text-secondary mb-2">
                請輸入「<strong>刪除</strong>」來確認
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="輸入 刪除"
                className="mb-4 text-center"
                autoComplete="off"
              />
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>取消</button>
                <button
                  className="btn-primary flex-1 text-sm"
                  style={deleteInput === '刪除' ? { background: '#DC2626', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.35)' } : { background: '#9CA3AF', boxShadow: 'none' }}
                  disabled={deleteInput !== '刪除'}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput('');
                    // Delete all user data completely
                    const keysToRemove = [
                      'mbti-match-user', 'mbti-match-daily', 'mbti-match-matches',
                      'mbti-match-likes', 'mbti-match-skipped', 'mochi_analytics_consent',
                      'mochi_blocked_users', 'mochi_blocked_names', 'mochi_reports',
                      'mochi_analytics', 'mochi_profile_visible', 'mochi_hide_age',
                    ];
                    keysToRemove.forEach(k => localStorage.removeItem(k));
                    if ('caches' in window) {
                      caches.delete('mochi-v1').catch(() => {});
                    }
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
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="status" aria-live="polite">
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
