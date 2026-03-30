'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { track } from '@/lib/analytics';
import { getAttachmentStyleLabel, getConflictStyleLabel, getLifePaceLabel } from '@/lib/personality-labels';

function getEnergyLabel(value: number) {
  if (value >= 70) return '高';
  if (value >= 40) return '中';
  return '低';
}

function getDepthLabel(value: number) {
  if (value >= 70) return '深';
  if (value >= 40) return '中';
  return '輕';
}

export default function PersonalityPage() {
  const { currentUser, authReady, onboardingStep, setOnboardingStep, updateProfile } = useApp();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (!currentUser.aiPersonality) {
      router.replace('/onboarding/ai-chat');
      return;
    }
    track('page_view', { page: 'personality' });
  }, [authReady, currentUser, router]);

  if (!authReady || !currentUser?.aiPersonality) return null;

  const personality = currentUser.aiPersonality;
  const scoring = personality.scoringFeatures;
  const tags = personality.tags && personality.tags.length > 0
    ? personality.tags
    : personality.values.slice(0, 6);
  const isOnboardingFlow = !currentUser.onboardingComplete || onboardingStep >= 4;

  const handleStartMatching = async () => {
    if (starting) return;
    setStarting(true);
    track('onboarding_complete');
    await updateProfile({ onboardingComplete: true });
    setOnboardingStep(5);
    router.push('/home');
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      {isOnboardingFlow && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-text-secondary">✨ 步驟 4/4 · 你的默契檔案</p>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-text-secondary mt-2">這份介紹已整合聊天內容、個人資料與偏好，確認後就能開始探索配對。</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-8 space-y-5">
        <div className="card !border-none relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255, 140, 107, 0.12), rgba(255, 107, 138, 0.08))' }}>
          <div className="absolute -top-12 -right-8 w-28 h-28 rounded-full opacity-30 blur-2xl pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' }} />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
              <Sparkles size={24} className="text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Mochi 默契檔案</p>
            <h1 className="text-2xl font-bold mb-2">{currentUser.name || '你'}在關係裡的樣子</h1>
            {(currentUser.occupation || currentUser.education) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentUser.occupation ? <span className="pill text-xs">{currentUser.occupation}</span> : null}
                {currentUser.education ? <span className="pill text-xs">{currentUser.education}</span> : null}
              </div>
            )}
            <p className="text-sm text-text-secondary leading-relaxed">{personality.bio}</p>
            {isOnboardingFlow && (
              <p className="text-xs text-text-secondary mt-3">這是你的正式公開檔案，接下來首頁推薦與配對理由都會以這份資料為基礎。</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">快速標籤</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={`${tag}-${index}`} className="pill text-xs">{tag}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="card">
            <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">💕 交往風格</p>
            <p className="text-sm leading-relaxed">{personality.datingStyle || '慢慢熟起來、感覺對了再更靠近。'}</p>
          </div>

          <div className="card">
            <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">🗣️ 溝通方式</p>
            <p className="text-sm leading-relaxed">{personality.communicationStyle}</p>
          </div>

          <div className="card">
            <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">🎯 關係期待</p>
            <p className="text-sm leading-relaxed">{personality.relationshipGoal}</p>
          </div>
        </div>

        {personality.traits.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">你最鮮明的特質</p>
            <div className="space-y-3">
              {personality.traits.slice(0, 4).map((trait) => (
                <div key={trait.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{trait.name}</span>
                    <span className="text-xs text-text-secondary">{trait.score}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--bg-input)' }}>
                    <div className="h-full rounded-full" style={{ width: `${trait.score}%`, background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scoring && (
          <div className="card">
            <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">默契線索</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3" style={{ background: 'var(--bg-input)' }}>
                <p className="text-[11px] text-text-secondary mb-1">依附風格</p>
                <p className="text-sm font-medium">{getAttachmentStyleLabel(scoring.attachmentStyle)}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: 'var(--bg-input)' }}>
                <p className="text-[11px] text-text-secondary mb-1">衝突處理</p>
                <p className="text-sm font-medium">{getConflictStyleLabel(scoring.conflictStyle)}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: 'var(--bg-input)' }}>
                <p className="text-[11px] text-text-secondary mb-1">社交能量</p>
                <p className="text-sm font-medium">{getEnergyLabel(scoring.socialEnergy)}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: 'var(--bg-input)' }}>
                <p className="text-[11px] text-text-secondary mb-1">情感深度</p>
                <p className="text-sm font-medium">{getDepthLabel(scoring.emotionalDepth)}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: 'var(--bg-input)' }}>
                <p className="text-[11px] text-text-secondary mb-1">愛的語言</p>
                <p className="text-sm font-medium">{scoring.loveLanguage || '相處觀察中'}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: 'var(--bg-input)' }}>
                <p className="text-[11px] text-text-secondary mb-1">生活節奏</p>
                <p className="text-sm font-medium">{getLifePaceLabel(scoring.lifePace)}</p>
              </div>
            </div>
          </div>
        )}

        {personality.redFlags && personality.redFlags.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">你在意的地雷</p>
            <div className="flex flex-wrap gap-2">
              {personality.redFlags.map((flag, index) => (
                <span key={`${flag}-${index}`} className="inline-flex items-center text-xs py-1.5 px-3 rounded-full font-medium" style={{ background: 'rgba(255,90,90,0.08)', color: 'var(--danger)' }}>
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 space-y-3">
        {isOnboardingFlow ? (
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => { void handleStartMatching(); }} disabled={starting}>
            {starting ? '準備推薦中...' : '開始探索配對'} <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn-primary w-full" onClick={() => router.push('/settings')}>
            返回我的頁面
          </button>
        )}
        <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={() => router.push('/onboarding/ai-chat?mode=reset')}>
          <RefreshCw size={16} /> 重新聊天分析
        </button>
      </div>
    </div>
  );
}
