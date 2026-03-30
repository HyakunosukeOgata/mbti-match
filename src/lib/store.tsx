'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { DailyCard, LikeAction, Match, UserProfile } from './types';
import { track, clearAnalytics } from './analytics';
import { uploadChatImage } from './chat-media';
import { supabase } from './supabase';
import { signOut as authSignOut } from './auth';
import { USER_SCOPED_STORAGE_KEYS, removeLegacyStorage, removeScopedStorage } from './client-storage';
import { loadProfilePhotos, syncProfilePhotos } from './profile-photos';
import { loadProfilesByDbIds, mapDbUserToProfile, mapLikeRow, mapMatchRow, type DbLikeRow, type DbMatchRow, type DbMessageRow, type DbUserRow } from './social';

interface AuthState {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  isHydrated: boolean;
  authReady: boolean;
  session: Session | null;
  login: (name: string) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

interface CardsState {
  dailyCards: DailyCard[];
  refreshDailyCards: () => Promise<void>;
  likeUser: (userId: string, topicAnswer: string) => Promise<string | null>;
  skipUser: (userId: string) => Promise<void>;
  likes: LikeAction[];
}

interface MatchesState {
  matches: Match[];
  sendMessage: (matchId: string, payload: { text?: string; imageDataUrl?: string }) => Promise<void>;
  removeMatch: (matchId: string) => Promise<void>;
}

interface OnboardingState {
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
}

const AuthContext = createContext<AuthState | null>(null);
const CardsContext = createContext<CardsState | null>(null);
const MatchesContext = createContext<MatchesState | null>(null);
const OnboardingContext = createContext<OnboardingState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AppProvider');
  return ctx;
}

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards must be within AppProvider');
  return ctx;
}

export function useMatches() {
  const ctx = useContext(MatchesContext);
  if (!ctx) throw new Error('useMatches must be within AppProvider');
  return ctx;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be within AppProvider');
  return ctx;
}

export function useApp() {
  const auth = useAuth();
  const cards = useCards();
  const matches = useMatches();
  const onboarding = useOnboarding();
  return { ...auth, ...cards, ...matches, ...onboarding };
}

async function authorizedJsonFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dailyCards, setDailyCards] = useState<DailyCard[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [likes, setLikes] = useState<LikeAction[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const currentUserRef = React.useRef(currentUser);
  currentUserRef.current = currentUser;
  const dailyCardsRef = React.useRef(dailyCards);
  dailyCardsRef.current = dailyCards;
  const matchesRef = React.useRef(matches);
  matchesRef.current = matches;
  const sessionRef = React.useRef(session);
  sessionRef.current = session;

  const isDemoBotUser = useCallback((user?: UserProfile) => {
    return !!user?.dbId && user.id === user.dbId;
  }, []);

  const buildDemoReply = useCallback((senderName: string, text: string) => {
    if (text.includes('你好') || text.includes('嗨')) {
      return `嗨 ${senderName}，很高興認識你。`;
    }

    const replies = [
      '這個開場很自然，我也想多聽一點你的故事。',
      '我對這個話題也很有感，感覺我們可以慢慢聊開。',
      '哈哈，這句有打到我，想知道你為什麼會這樣想。',
      '有默契耶，我通常也會從這種生活小事開始聊天。',
    ];

    return replies[text.length % replies.length];
  }, []);

  const clearRuntimeState = useCallback(() => {
    setCurrentUser(null);
    setDailyCards([]);
    setMatches([]);
    setLikes([]);
    setOnboardingStep(0);
  }, []);

  const clearPersistedUserState = useCallback((userId?: string | null) => {
    removeScopedStorage(USER_SCOPED_STORAGE_KEYS, userId);
    removeLegacyStorage([
      ...USER_SCOPED_STORAGE_KEYS,
      'mbti-match-user',
      'mochi_analytics',
      'mochi_analytics_consent',
    ]);
    if ('caches' in window) {
      caches.delete('mochi-v2').catch(() => {});
      caches.delete('mochi-v1').catch(() => {});
    }
  }, []);

  const loadUserProfile = useCallback(async (supabaseUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', supabaseUserId)
        .maybeSingle<DbUserRow>();

      if (error) {
        setCurrentUser(null);
        setOnboardingStep(0);
        return;
      }

      if (!data) {
        setCurrentUser({
          id: supabaseUserId,
          dbId: undefined,
          name: '',
          occupation: '',
          education: '',
          age: 25,
          gender: 'other',
          bio: '',
          photos: [],
          aiPersonality: undefined,
          preferences: {
            ageMin: 20,
            ageMax: 35,
            genderPreference: ['female', 'male', 'other'],
            region: '台北市',
          },
          onboardingComplete: false,
          createdAt: new Date().toISOString(),
        });
        setOnboardingStep(1);
        return;
      }

      const photos = await loadProfilePhotos(data.id);
      const user = mapDbUserToProfile(data, photos);
      setCurrentUser(user);
      setOnboardingStep(user.onboardingComplete ? 5 : user.aiPersonality ? 4 : 1);
    } catch {
      setCurrentUser(null);
      setOnboardingStep(0);
    }
  }, []);

  const loadLikes = useCallback(async (userDbId: string, currentUserAuthId: string) => {
    const { data: likeRows, error } = await supabase
      .from('likes')
      .select('*')
      .eq('from_user_id', userDbId)
      .order('created_at', { ascending: false });

    if (error || !likeRows) {
      setLikes([]);
      return;
    }

    const relatedIds = [...new Set((likeRows as DbLikeRow[]).flatMap((row) => [row.from_user_id, row.to_user_id]))];
    const profilesByDbId = await loadProfilesByDbIds(supabase, relatedIds);
    const mapped = (likeRows as DbLikeRow[])
      .map((row) => mapLikeRow(row, currentUserAuthId, profilesByDbId))
      .filter((row): row is NonNullable<typeof row> => !!row);
    setLikes(mapped);
  }, []);

  const loadMatches = useCallback(async () => {
    const activeUser = currentUserRef.current;
    if (!activeUser?.dbId) {
      setMatches([]);
      return;
    }

    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${activeUser.dbId},user2_id.eq.${activeUser.dbId}`)
      .neq('status', 'removed')
      .order('created_at', { ascending: false });

    if (matchError || !matchRows) {
      setMatches([]);
      return;
    }

    if (matchRows.length === 0) {
      setMatches([]);
      return;
    }

    const hiddenMatchIds = new Set(activeUser.preferences.hiddenMatchIds || []);

    const visibleMatchRows = (matchRows as DbMatchRow[]).filter((row) => !hiddenMatchIds.has(row.id));
    if (visibleMatchRows.length === 0) {
      setMatches([]);
      return;
    }

    const matchIds = visibleMatchRows.map((row) => row.id);
    const participantIds = [...new Set(visibleMatchRows.flatMap((row) => [row.user1_id, row.user2_id]))];
    const [{ data: messageRows, error: messageError }, profilesByDbId] = await Promise.all([
      supabase.from('messages').select('*').in('match_id', matchIds).order('created_at', { ascending: true }),
      loadProfilesByDbIds(supabase, participantIds),
    ]);

    if (messageError) {
      setMatches([]);
      return;
    }

    const messagesByMatchId = new Map<string, DbMessageRow[]>();
    for (const message of (messageRows || []) as DbMessageRow[]) {
      const bucket = messagesByMatchId.get(message.match_id) || [];
      bucket.push(message);
      messagesByMatchId.set(message.match_id, bucket);
    }

    const mapped = visibleMatchRows
      .map((row) => mapMatchRow(row, activeUser.dbId!, activeUser.id, profilesByDbId, messagesByMatchId.get(row.id) || []))
      .filter((row): row is NonNullable<typeof row> => !!row);
    setMatches(mapped);
  }, []);

  const refreshDailyCards = useCallback(async () => {
    const accessToken = sessionRef.current?.access_token;
    if (!accessToken) {
      setDailyCards([]);
      return;
    }

    const result = await authorizedJsonFetch<{ cards: DailyCard[] }>('/api/social/cards', accessToken);
    setDailyCards(result?.cards || []);
  }, []);

  useEffect(() => {
    let mounted = true;
    removeLegacyStorage(USER_SCOPED_STORAGE_KEYS);

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      if (initialSession?.user) {
        void loadUserProfile(initialSession.user.id).finally(() => {
          if (mounted) setAuthReady(true);
        });
      } else {
        clearRuntimeState();
        setIsHydrated(true);
        setAuthReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadUserProfile(nextSession.user.id).finally(() => setAuthReady(true));
      } else {
        clearRuntimeState();
        setIsHydrated(true);
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearRuntimeState, loadUserProfile]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser?.dbId) {
      setMatches([]);
      setLikes([]);
      setDailyCards([]);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;
    setIsHydrated(false);

    Promise.all([
      loadLikes(currentUser.dbId, currentUser.id),
      loadMatches(),
    ]).finally(() => {
      if (!cancelled) setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser?.dbId, currentUser?.id, loadLikes, loadMatches]);

  useEffect(() => {
    if (!authReady || !currentUser?.dbId) return;

    const refreshSocial = () => {
      void loadMatches();
      void loadLikes(currentUser.dbId!, currentUser.id);
    };

    const channelA = supabase
      .channel(`matches-user1-${currentUser.dbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user1_id=eq.${currentUser.dbId}` }, refreshSocial)
      .subscribe();

    const channelB = supabase
      .channel(`matches-user2-${currentUser.dbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user2_id=eq.${currentUser.dbId}` }, refreshSocial)
      .subscribe();

    const channelC = supabase
      .channel(`likes-${currentUser.dbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, refreshSocial)
      .subscribe();

    const channelD = supabase
      .channel(`messages-${currentUser.dbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { void loadMatches(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channelA);
      void supabase.removeChannel(channelB);
      void supabase.removeChannel(channelC);
      void supabase.removeChannel(channelD);
    };
  }, [authReady, currentUser?.dbId, currentUser?.id, loadLikes, loadMatches]);

  const login = useCallback((_name: string) => {
    track('login');
  }, []);

  const logout = useCallback(async () => {
    const activeUserId = sessionRef.current?.user.id ?? currentUserRef.current?.id;
    track('logout');
    clearAnalytics();
    clearRuntimeState();
    clearPersistedUserState(activeUserId);
    setSession(null);
    if (sessionRef.current) {
      await authSignOut();
    }
  }, [clearPersistedUserState, clearRuntimeState]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    const activeSession = sessionRef.current;
    const activeUserId = activeSession?.user.id ?? currentUserRef.current?.id;
    if (!activeSession?.access_token) return false;

    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeSession.access_token}` },
      });
      if (!res.ok) return false;
      clearRuntimeState();
      clearPersistedUserState(activeUserId);
      setSession(null);
      await authSignOut();
      return true;
    } catch {
      return false;
    }
  }, [clearPersistedUserState, clearRuntimeState]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const previousUser = currentUserRef.current;
    if (!previousUser) return;

    track('profile_updated');
    const updated: UserProfile = {
      ...previousUser,
      ...updates,
      dbId: updates.dbId ?? previousUser.dbId,
      preferences: updates.preferences
        ? { ...previousUser.preferences, ...updates.preferences }
        : previousUser.preferences,
    };

    setCurrentUser(updated);

    const activeSession = sessionRef.current;
    if (!activeSession?.user) return;

    const { data, error } = await supabase.from('users').upsert({
      auth_id: activeSession.user.id,
      email: activeSession.user.email,
      name: updated.name || '未命名',
      age: updated.age,
      hide_age: updated.hideAge ?? false,
      profile_visible: updated.profileVisible ?? true,
      gender: updated.gender,
      bio: updated.bio,
      region: updated.preferences.region,
      ai_personality: updated.aiPersonality || null,
      preferences: {
        ageMin: updated.preferences.ageMin,
        ageMax: updated.preferences.ageMax,
        genderPreference: updated.preferences.genderPreference,
        preferredRegions: updated.preferences.preferredRegions || [],
        occupation: updated.occupation || undefined,
        education: updated.education || undefined,
        hiddenMatchIds: updated.preferences.hiddenMatchIds || [],
        notificationPrefs: updated.preferences.notificationPrefs || undefined,
      },
      onboarding_complete: updated.onboardingComplete,
    }, { onConflict: 'auth_id' }).select('id').single();

    if (error) return;

    const userDbId = data?.id ?? updated.dbId;
    if (!userDbId) return;

    if (updates.photos) {
      try {
        await syncProfilePhotos({
          authUserId: activeSession.user.id,
          userDbId,
          photos: updated.photos,
        });
      } catch {
        return;
      }
    }

    setCurrentUser((current) => current ? { ...current, dbId: userDbId } : current);
  }, []);

  const likeUser = useCallback(async (userId: string, topicAnswer: string) => {
    const activeUser = currentUserRef.current;
    const accessToken = sessionRef.current?.access_token;
    const targetCard = dailyCardsRef.current.find((card) => card.user.id === userId);
    if (!activeUser?.dbId || !accessToken || !targetCard?.user.dbId || targetCard.liked) return null;

    track('card_like', { targetUserId: userId });
    setDailyCards((prev) => prev.map((card) => card.user.id === userId ? { ...card, liked: true, topicAnswer } : card));

    const result = await authorizedJsonFetch<{ matched: boolean; matchId?: string }>('/api/social/like', accessToken, {
      method: 'POST',
      body: JSON.stringify({ targetUserDbId: targetCard.user.dbId, topicAnswer }),
    });

    if (result?.matchId) {
      track('match_created', { matchedUserId: userId, matchId: result.matchId });
    }

    await Promise.all([
      loadLikes(activeUser.dbId, activeUser.id),
      loadMatches(),
      refreshDailyCards(),
    ]);

    return result?.matchId || null;
  }, [loadLikes, loadMatches, refreshDailyCards]);

  const skipUser = useCallback(async (userId: string) => {
    const accessToken = sessionRef.current?.access_token;
    const targetCard = dailyCardsRef.current.find((card) => card.user.id === userId);
    if (!accessToken || !targetCard?.user.dbId) return;

    track('card_skip', { targetUserId: userId });
    const result = await authorizedJsonFetch<{ cards: DailyCard[] }>('/api/social/cards', accessToken, {
      method: 'POST',
      body: JSON.stringify({ action: 'skip', targetUserDbId: targetCard.user.dbId }),
    });
    setDailyCards(result?.cards || dailyCardsRef.current.map((card) => card.user.id === userId ? { ...card, skipped: true } : card));
  }, []);

  const sendMessageAction = useCallback(async (matchId: string, payload: { text?: string; imageDataUrl?: string }) => {
    const accessToken = sessionRef.current?.access_token;
    const authUserId = sessionRef.current?.user.id;
    const activeUser = currentUserRef.current;
    const activeMatch = matchesRef.current.find((match) => match.id === matchId);
    const trimmedText = payload.text?.trim() || '';
    if (!accessToken || (!trimmedText && !payload.imageDataUrl) || !authUserId || !activeUser) return;

    let imageUrl: string | undefined;
    if (payload.imageDataUrl) {
      try {
        imageUrl = await uploadChatImage({
          authUserId,
          matchId,
          dataUrl: payload.imageDataUrl,
        });
      } catch {
        return; // Upload failed — don't add a ghost message
      }
    }

    const optimisticTimestamp = new Date().toISOString();
    const optimisticId = `temp-${matchId}-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      senderId: authUserId,
      type: imageUrl ? 'image' as const : 'text' as const,
      text: trimmedText,
      imageUrl,
      timestamp: optimisticTimestamp,
      readAt: null,
    };

    setMatches((prev) => prev.map((match) => match.id === matchId
      ? { ...match, messages: [...match.messages, optimisticMessage] }
      : match));

    track(imageUrl ? 'chat_image_sent' : 'chat_message_sent');
    const result = await authorizedJsonFetch<{ message: Match['messages'][number] }>('/api/social/messages', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        text: trimmedText,
        kind: imageUrl ? 'image' : 'text',
        imageUrl,
      }),
    });

    if (result?.message) {
      setMatches((prev) => prev.map((match) => {
        if (match.id !== matchId) return match;
        const messages = match.messages.filter((message) => message.id !== optimisticId);
        return { ...match, messages: [...messages, result.message] };
      }));
    }

    if (isDemoBotUser(activeMatch?.otherUser) && trimmedText) {
      const demoReplyText = buildDemoReply(activeUser.name || '你', trimmedText);
      const demoReplyId = `demo-reply-${matchId}-${Date.now()}`;
      const demoReplySenderId = activeMatch?.otherUser?.id || activeMatch?.otherUser?.dbId || 'demo-bot';

      window.setTimeout(() => {
        setMatches((prev) => prev.map((match) => {
          if (match.id !== matchId) return match;
          const alreadyHasReply = match.messages.some((message) =>
            message.senderId === demoReplySenderId && new Date(message.timestamp).getTime() >= new Date(optimisticTimestamp).getTime()
          );
          if (alreadyHasReply) return match;
          return {
            ...match,
            messages: [...match.messages, {
              id: demoReplyId,
              senderId: demoReplySenderId,
              type: 'text',
              text: demoReplyText,
              timestamp: new Date().toISOString(),
              readAt: null,
            }],
          };
        }));
      }, 900);
    }

    await loadMatches();
  }, [buildDemoReply, isDemoBotUser, loadMatches]);

  const removeMatchAction = useCallback(async (matchId: string) => {
    const activeUser = currentUserRef.current;
    if (!activeUser) return;

    const hiddenMatchIds = new Set(activeUser.preferences.hiddenMatchIds || []);
    hiddenMatchIds.add(matchId);
    await updateProfile({
      preferences: {
        ...activeUser.preferences,
        hiddenMatchIds: Array.from(hiddenMatchIds),
      },
    });
    await loadMatches();
  }, [loadMatches, updateProfile]);

  const authValue = useMemo<AuthState>(() => ({
    currentUser,
    setCurrentUser,
    isLoggedIn: !!currentUser,
    isHydrated,
    authReady,
    session,
    login,
    logout,
    deleteAccount,
    updateProfile,
  }), [currentUser, isHydrated, authReady, session, login, logout, deleteAccount, updateProfile]);

  const cardsValue = useMemo<CardsState>(() => ({
    dailyCards,
    refreshDailyCards,
    likeUser,
    skipUser,
    likes,
  }), [dailyCards, refreshDailyCards, likeUser, skipUser, likes]);

  const matchesValue = useMemo<MatchesState>(() => ({
    matches,
    sendMessage: sendMessageAction,
    removeMatch: removeMatchAction,
  }), [matches, sendMessageAction, removeMatchAction]);

  const onboardingValue = useMemo<OnboardingState>(() => ({
    onboardingStep,
    setOnboardingStep,
  }), [onboardingStep]);

  return (
    <AuthContext.Provider value={authValue}>
      <OnboardingContext.Provider value={onboardingValue}>
        <MatchesContext.Provider value={matchesValue}>
          <CardsContext.Provider value={cardsValue}>
            {children}
          </CardsContext.Provider>
        </MatchesContext.Provider>
      </OnboardingContext.Provider>
    </AuthContext.Provider>
  );
}
