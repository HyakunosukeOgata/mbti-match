'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { getSession, signInWithPassword } from '@/lib/auth';
import { useApp } from '@/lib/store';
import type { AIPersonality, PersonalityTrait, ScoringFeatures } from '@/lib/types';
import { saveProfileBioSource, type ProfileBioSourceMessage } from '@/lib/profile-bio-source';

type TryChatResult = {
  bio?: unknown;
  traits?: unknown;
  values?: unknown;
  datingStyle?: unknown;
  communicationStyle?: unknown;
  relationshipGoal?: unknown;
  redFlags?: unknown;
  tags?: unknown;
  attachmentStyle?: unknown;
  conflictStyle?: unknown;
  loveLanguage?: unknown;
  lifePace?: unknown;
};

const STORAGE_KEY = 'mochi_try_chat';

type TryChatPayload = {
  messages?: ProfileBioSourceMessage[];
  result?: TryChatResult | null;
};

function loadTryPayload(): TryChatPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TryChatPayload;
  } catch {
    return null;
  }
}

function normalizeTraits(input: unknown): PersonalityTrait[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const trait = item as Record<string, unknown>;
      const name = typeof trait.name === 'string' ? trait.name : '';
      const score = typeof trait.score === 'number' ? trait.score : 50;
      const category = trait.category;
      const safeCategory: PersonalityTrait['category'] =
        category === 'social' || category === 'emotional' || category === 'lifestyle' || category === 'values'
          ? category
          : 'values';

      if (!name) return null;
      return { name, score, category: safeCategory };
    })
    .filter((item): item is PersonalityTrait => !!item);
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function buildScoringFeatures(result: TryChatResult): ScoringFeatures {
  const attachmentStyle = result.attachmentStyle;
  const conflictStyle = result.conflictStyle;
  const lifePace = result.lifePace;

  return {
    attachmentStyle:
      attachmentStyle === 'secure' || attachmentStyle === 'anxious' || attachmentStyle === 'avoidant' || attachmentStyle === 'mixed'
        ? attachmentStyle
        : 'mixed',
    socialEnergy: 60,
    conflictStyle:
      conflictStyle === 'confronter' || conflictStyle === 'avoider' || conflictStyle === 'collaborator' || conflictStyle === 'compromiser'
        ? conflictStyle
        : 'collaborator',
    loveLanguage: typeof result.loveLanguage === 'string' ? result.loveLanguage : '優質陪伴',
    lifePace: lifePace === 'slow' || lifePace === 'moderate' || lifePace === 'fast' ? lifePace : 'moderate',
    emotionalDepth: 70,
  };
}

function mapTryResultToPersonality(result: TryChatResult): AIPersonality {
  return {
    bio: typeof result.bio === 'string' ? result.bio : '',
    traits: normalizeTraits(result.traits),
    values: normalizeStringArray(result.values),
    datingStyle: typeof result.datingStyle === 'string' ? result.datingStyle : '',
    communicationStyle: typeof result.communicationStyle === 'string' ? result.communicationStyle : '自然聊天型，先從有感的話題慢慢熟起來。',
    relationshipGoal: typeof result.relationshipGoal === 'string' ? result.relationshipGoal : '找到可以自在相處、願意認真認識彼此的人。',
    redFlags: normalizeStringArray(result.redFlags),
    tags: normalizeStringArray(result.tags),
    scoringFeatures: buildScoringFeatures(result),
    chatSummary: '由體驗模式聊天分析轉入正式帳號。',
    analyzedAt: new Date().toISOString(),
  };
}

export default function TryClaimPage() {
  const router = useRouter();
  const { authReady, currentUser, isLoggedIn, updateProfile } = useApp();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimingProfile, setClaimingProfile] = useState(false);
  const [error, setError] = useState('');
  const [signupReady, setSignupReady] = useState(false);

  const tryPayload = useMemo(() => loadTryPayload(), []);
  const tryResult = tryPayload?.result || null;
  const tryMessages = tryPayload?.messages || [];
  const personality = useMemo(() => (tryResult ? mapTryResultToPersonality(tryResult) : null), [tryResult]);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const waitForAuthenticatedProfile = async () => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < 12000) {
      const activeSession = await getSession().catch(() => null);
      if (activeSession?.session?.user && currentUserRef.current) {
        return true;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    }

    return false;
  };

  useEffect(() => {
    if (!tryResult) {
      router.replace('/try');
    }
  }, [router, tryResult]);

  useEffect(() => {
    if (!authReady || !signupReady || !isLoggedIn || !currentUser || !personality || claimingProfile) return;

    let cancelled = false;
    const activeUser = currentUser;
    const activePersonality = personality;
    const resolvedName = nickname.trim() || activeUser.name;

    async function claimProfile() {
      setClaimingProfile(true);
      setLoading(false);
      try {
        await updateProfile({
          name: resolvedName,
          aiPersonality: activePersonality,
          onboardingComplete: false,
        });
        if (!cancelled) {
          saveProfileBioSource(tryMessages);
          router.replace('/personality');
        }
      } catch {
        if (!cancelled) {
          setError('帳號已建立，但人格檔案同步失敗，請重新嘗試');
          setLoading(false);
          setSignupReady(false);
          setClaimingProfile(false);
        }
      }
    }

    void claimProfile();

    return () => {
      cancelled = true;
    };
  }, [authReady, signupReady, isLoggedIn, currentUser, personality, claimingProfile, updateProfile, router, nickname, tryMessages]);

  const handleContinue = async () => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('請先輸入暱稱');
      return;
    }
    if (!personality) {
      setError('找不到體驗結果，請先回去聊完 AI');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/experience-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedNickname }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.email || !payload.password) {
        setError(payload.error || '建立體驗帳號失敗');
        setLoading(false);
        return;
      }

      const { error: authError } = await signInWithPassword(payload.email, payload.password);
      if (authError) {
        setError(authError.message || '登入體驗帳號失敗');
        setLoading(false);
        return;
      }

      const ready = await waitForAuthenticatedProfile();
      if (!ready) {
        setError('登入完成，但載入你的資料花太久了，請再試一次');
        setLoading(false);
        return;
      }

      setSignupReady(true);
    } catch (signupError: unknown) {
      setError(signupError instanceof Error ? signupError.message : '建立體驗帳號失敗');
      setLoading(false);
    }
  };

  if (!tryResult || !personality) return null;

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-8" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md rounded-[28px] p-6 shadow-sm" style={{ background: 'white', border: '1px solid #F2E8E0' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' }}>
          <Sparkles size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">先保存聊天內容，再完成註冊</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          先幫你建立一個可直接使用的帳號，保留剛剛的聊天內容與人格理解，等你補完個人資料後，再一起生成正式公開自介。
        </p>

        <div className="rounded-2xl p-4 mb-5" style={{ background: '#FFF8F3' }}>
          <p className="text-xs font-semibold text-text-secondary mb-2">這份聊天理解會先帶進去</p>
          <p className="text-sm font-medium mb-2">{personality.bio || '已完成你的個性分析'}</p>
          <div className="flex flex-wrap gap-2">
            {personality.tags?.slice(0, 4).map((tag, index) => (
              <span key={`${tag}-${index}`} className="text-xs px-3 py-1 rounded-full" style={{ background: 'white', color: 'var(--primary-dark)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value.slice(0, 20))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleContinue();
              }
            }}
            placeholder="輸入你的暱稱"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ border: '1px solid #E8DDD5', background: '#FFFAF7' }}
            disabled={loading || claimingProfile}
            data-testid="try-claim-nickname"
          />
          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={() => { void handleContinue(); }}
            disabled={!nickname.trim() || loading || claimingProfile}
            data-testid="try-claim-continue"
          >
            {loading || claimingProfile ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {claimingProfile ? '正在帶入分析...' : loading ? '建立帳號中...' : '繼續填寫個人資料'}
          </button>
          <button
            className="w-full py-3 rounded-2xl text-sm font-medium"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
            onClick={() => router.push('/try')}
            disabled={loading || claimingProfile}
          >
            回去重新聊聊
          </button>
        </div>

        {error && <p className="text-xs text-red-500 text-center mt-3">{error}</p>}
      </div>
    </div>
  );
}
