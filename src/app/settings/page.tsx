'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import React from 'react';
import { LogOut, Sliders, Shield, ChevronRight, Camera, Trash2, Eye, RefreshCw } from 'lucide-react';
import { track } from '@/lib/analytics';
import { moderateBio, moderateName } from '@/lib/moderation';
import { TAIWAN_CITIES } from '@/lib/types';
import { compressImage } from '@/lib/compressImage';

export default function SettingsPage() {
  const { currentUser, authReady, updateProfile, logout, deleteAccount } = useApp();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editOccupation, setEditOccupation] = useState(currentUser?.occupation || '');
  const [editEducation, setEditEducation] = useState(currentUser?.education || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [profileVisible, setProfileVisible] = useState(true);
  const [hideAge, setHideAge] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
    } else if (!currentUser.onboardingComplete) {
      router.replace('/onboarding/ai-chat');
    } else {
      track('page_view', { page: 'settings' });
    }
  }, [authReady, currentUser, router]);
  const MAX_PHOTOS = 6;

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
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ 照片不可超過 5MB');
      e.target.value = '';
      return;
    }
    compressImage(file).then(dataUrl => {
      setPhotos(prev => [...prev, dataUrl]);
    }).catch(() => {
      showToast('❌ 照片處理失敗');
    });
    e.target.value = '';
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (savingProfile) return;

    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 20) {
      showToast('❗ 昵稱需為 1-20 字');
      return;
    }
    const nameCheck = moderateName(trimmedName);
    if (!nameCheck.allowed) {
      showToast(`❌ ${nameCheck.reason || '暱稱不符合規範'}`);
      return;
    }
    if (bio.trim()) {
      const bioCheck = moderateBio(bio);
      if (!bioCheck.allowed) {
        showToast(`❌ ${bioCheck.reason || '自我介紹不符合規範'}`);
        return;
      }
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: trimmedName,
        occupation: editOccupation.trim(),
        education: editEducation.trim(),
        photos,
        bio,
      });
      setEditMode(false);
      showToast('✅ 已儲存');
    } finally {
      setSavingProfile(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  useEffect(() => {
    if (!currentUser) return;
    setPhotos(currentUser.photos || []);
    setBio(currentUser.bio || '');
    setEditName(currentUser.name || '');
    setEditOccupation(currentUser.occupation || '');
    setEditEducation(currentUser.education || '');
    setProfileVisible(currentUser.profileVisible ?? true);
    setHideAge(currentUser.hideAge ?? false);
  }, [currentUser]);

  if (!authReady || !currentUser) return null;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const previewName = editMode ? (editName.trim() || currentUser.name) : currentUser.name;
  const previewBio = editMode ? bio : currentUser.bio;
  const previewPhotos = editMode ? photos : currentUser.photos;

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
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
        <div className="card !border-none overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(255, 140, 107, 0.08), rgba(255, 107, 107, 0.05))' }}>
          {/* Decorative gradient orb */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' }} />
          <div className="relative flex items-center gap-4 mb-4">
            {currentUser.photos.length > 0 ? (
              <div className="w-18 h-18 rounded-2xl overflow-hidden ring-2 ring-primary/20 ring-offset-2" style={{ boxShadow: '0 4px 20px rgba(255, 140, 107, 0.25)', width: 72, height: 72 }}>
                <img src={currentUser.photos[0]} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-center justify-center text-2xl font-bold text-white gradient-bg ring-2 ring-primary/20 ring-offset-2" style={{ boxShadow: '0 4px 20px rgba(255, 140, 107, 0.25)', width: 72, height: 72, borderRadius: 16 }}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{currentUser.name}</p>
              {(currentUser.occupation || currentUser.education) && (
                <p className="text-xs text-text-secondary mt-1 truncate">
                  {[currentUser.occupation, currentUser.education].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-text-secondary">{currentUser.age}歲</span>
                {currentUser.aiPersonality?.values.slice(0, 2).map((v, i) => (
                  <span key={i} className="personality-badge text-[10px]">{v}</span>
                ))}
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
              <button
                className="btn-secondary text-sm w-full mt-2 flex items-center justify-center gap-1.5"
                onClick={() => setShowPreview(true)}
              >
                <Eye size={15} /> 預覽個人檔案
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
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wider">職業</label>
                  <input
                    type="text"
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    maxLength={40}
                    placeholder="例如：產品設計師"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block uppercase tracking-wider">學歷</label>
                  <input
                    type="text"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                    maxLength={60}
                    placeholder="例如：大學畢業、碩士在學"
                  />
                </div>
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
                        className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-red-500 transition-all"
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
                <button className="btn-secondary flex-1 text-sm" onClick={() => { setPhotos(currentUser.photos); setBio(currentUser.bio); setEditName(currentUser.name); setEditOccupation(currentUser.occupation || ''); setEditEducation(currentUser.education || ''); setEditMode(false); }}>
                  取消
                </button>
                <button className="btn-primary flex-1 text-sm" onClick={handleSave} disabled={savingProfile}>
                  {savingProfile ? '儲存中...' : '💾 儲存變更'}
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
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 140, 107, 0.08)' }}>
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

        <button
          className="card w-full text-left group"
          onClick={() => router.push('/onboarding/ai-chat?mode=reset')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 140, 107, 0.08)' }}>
                <RefreshCw size={15} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold">重新 AI 聊天分析</h3>
                <p className="text-xs text-text-secondary mt-0.5">保留照片與自介，只更新個性分析結果</p>
              </div>
            </div>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform text-text-secondary" />
          </div>
        </button>

        {/* Privacy settings */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 140, 107, 0.08)' }}>
              <Shield size={15} className="text-primary" />
            </div>
            <h3 className="font-bold">🔒 隱私設定</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">個人檔案可見</p>
                <p className="text-xs text-text-secondary mt-0.5">關閉後不會出現在他人的推薦中</p>
              </div>
              <button
                onClick={async () => {
                  const next = !profileVisible;
                  setProfileVisible(next);
                  await updateProfile({ profileVisible: next });
                  showToast(next ? '✅ 已恢復顯示' : '⏸️ 已隱藏檔案');
                }}
                role="switch"
                aria-checked={profileVisible}
                aria-label="個人檔案可見"
                className="p-2 -m-2"
              >
                <div className={`w-12 h-7 rounded-full transition-colors relative ${profileVisible ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${profileVisible ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">隱藏年齡</p>
                <p className="text-xs text-text-secondary mt-0.5">他人將看不到你的年齡</p>
              </div>
              <button
                onClick={async () => {
                  const next = !hideAge;
                  setHideAge(next);
                  await updateProfile({ hideAge: next });
                  showToast(next ? '🙈 已隱藏年齡' : '✅ 已顯示年齡');
                }}
                role="switch"
                aria-checked={hideAge}
                aria-label="隱藏年齡"
                className="p-2 -m-2"
              >
                <div className={`w-12 h-7 rounded-full transition-colors relative ${hideAge ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${hideAge ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-text-secondary">
                💡 暫停檔案後，你的現有配對和聊天不會受影響，只是不會出現在新的推薦中。
              </p>
            </div>
          </div>
        </div>

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
          <a href="/faq" className="text-xs text-text-secondary hover:text-primary transition-colors">常見問題</a>
          <span className="text-xs text-border">·</span>
          <a href="/privacy" className="text-xs text-text-secondary hover:text-primary transition-colors">隱私權政策</a>
          <span className="text-xs text-border">·</span>
          <a href="/terms" className="text-xs text-text-secondary hover:text-primary transition-colors">服務條款</a>
          <span className="text-xs text-border">·</span>
          <a href="/support" className="text-xs text-text-secondary hover:text-primary transition-colors">聯絡我們</a>
        </div>

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
                  style={deleteInput.trim() === '刪除' ? { background: '#DC2626', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.35)' } : { background: '#9CA3AF', boxShadow: 'none' }}
                  disabled={deleteInput.trim() !== '刪除' || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const ok = await deleteAccount();
                    setDeleting(false);
                    if (ok) {
                      window.location.href = '/';
                    } else {
                      setShowDeleteConfirm(false);
                      setDeleteInput('');
                      showToast('❌ 刪除失敗，請稍後再試');
                    }
                  }}
                >
                  {deleting ? '刪除中...' : '永久刪除'}
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

      {/* Profile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 200 }} onClick={() => setShowPreview(false)}>
          <div className="mx-4 max-w-sm w-full max-h-[85dvh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in" style={{ background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">👀 別人看到的你</p>
              <button onClick={() => setShowPreview(false)} className="text-text-secondary hover:text-text text-sm font-medium">關閉</button>
            </div>

            {/* Photo */}
            {previewPhotos.length > 0 ? (
              <div className="mx-5 aspect-[4/5] rounded-2xl overflow-hidden">
                <img src={previewPhotos[0]} alt={previewName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mx-5 aspect-[4/5] rounded-2xl flex items-center justify-center text-6xl font-bold text-white gradient-bg">
                {previewName.charAt(0)}
              </div>
            )}

            {/* Info */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold">{previewName}</h2>
                {!hideAge && <span className="text-text-secondary">{currentUser.age}歲</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-text-secondary">{currentUser.preferences.region}</span>
                {currentUser.aiPersonality?.values.slice(0, 2).map((v, i) => (
                  <span key={i} className="personality-badge text-[10px]">{v}</span>
                ))}
              </div>
            </div>

            {/* Bio */}
            {previewBio ? (
              <div className="mx-5 mt-2 p-3.5 rounded-xl" style={{ background: 'rgba(255,140,107,0.06)' }}>
                <p className="text-sm leading-relaxed text-text">{previewBio}</p>
              </div>
            ) : (
              <div className="mx-5 mt-2 p-3.5 rounded-xl" style={{ background: 'rgba(255,140,107,0.06)' }}>
                <p className="text-sm text-text-secondary italic">尚未填寫自我介紹</p>
              </div>
            )}

            {/* Additional photos */}
            {previewPhotos.length > 1 && (
              <div className="px-5 mt-3">
                <div className="flex gap-2 overflow-x-auto">
                  {previewPhotos.slice(1).map((p, i) => (
                    <img key={i} src={p} alt={`照片 ${i + 2}`} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {/* AI personality preview */}
            {currentUser.aiPersonality && (
              <div className="mx-5 mt-3 mb-5">
                <p className="text-xs font-semibold text-text-secondary mb-2">✨ AI 分析的個性標籤</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.aiPersonality.values.slice(0, 4).map((v, i) => (
                    <span key={i} className="pill text-xs">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {!currentUser.aiPersonality && <div className="h-5" />}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
