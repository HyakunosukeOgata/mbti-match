'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { UserProfile, Match, DailyCard, LikeAction, ConversationTopic, ChatMessage } from './types';
import { mockUsers, conversationTopics } from './mock-data';
import { calculateCompatibility, getDailyMatches, getSharedAnswers } from './matching';
import { track, clearAnalytics } from './analytics';

let msgCounter = 0;

// ============================
// Context Types
// ============================
interface AuthState {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (name: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

interface CardsState {
  dailyCards: DailyCard[];
  refreshDailyCards: () => void;
  likeUser: (userId: string, topicAnswer: string) => boolean;
  skipUser: (userId: string) => void;
  undoSkip: (userId: string) => void;
  likes: LikeAction[];
}

interface MatchesState {
  matches: Match[];
  sendMessage: (matchId: string, text: string) => void;
  removeMatch: (matchId: string) => void;
}

interface OnboardingState {
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
}

// ============================
// 4 Separate Contexts
// ============================
const AuthContext = createContext<AuthState | null>(null);
const CardsContext = createContext<CardsState | null>(null);
const MatchesContext = createContext<MatchesState | null>(null);
const OnboardingContext = createContext<OnboardingState | null>(null);

// ============================
// Individual hooks (recommended — only re-render on relevant changes)
// ============================
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

// Backward-compatible combined hook
export function useApp() {
  const auth = useAuth();
  const cards = useCards();
  const matches = useMatches();
  const onboarding = useOnboarding();
  return { ...auth, ...cards, ...matches, ...onboarding };
}

// ============================
// Helpers
// ============================
function getRandomTopics(count: number): ConversationTopic[] {
  const shuffled = [...conversationTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================
// AppProvider (4 nested context providers)
// ============================
export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dailyCards, setDailyCards] = useState<DailyCard[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [likes, setLikes] = useState<LikeAction[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const matchesRef = React.useRef(matches);
  matchesRef.current = matches;
  const dailyCardsRef = React.useRef(dailyCards);
  dailyCardsRef.current = dailyCards;
  const currentUserRef = React.useRef(currentUser);
  currentUserRef.current = currentUser;
  const likesRef = React.useRef(likes);
  likesRef.current = likes;

  // 載入 localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mbti-match-user');
      if (saved) {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        if (user.onboardingComplete) {
          setOnboardingStep(4);
        }
      }
      const savedMatches = localStorage.getItem('mbti-match-matches');
      if (savedMatches) setMatches(JSON.parse(savedMatches));
      const savedLikes = localStorage.getItem('mbti-match-likes');
      if (savedLikes) setLikes(JSON.parse(savedLikes));
      const savedCards = localStorage.getItem('mbti-match-daily');
      if (savedCards) {
        const parsed = JSON.parse(savedCards);
        if (parsed.date === new Date().toDateString()) {
          setDailyCards(parsed.cards);
        }
      }
    } catch {
      localStorage.removeItem('mbti-match-user');
      localStorage.removeItem('mbti-match-matches');
      localStorage.removeItem('mbti-match-likes');
      localStorage.removeItem('mbti-match-daily');
    }
    setIsHydrated(true);
  }, []);

  // 儲存到 localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (currentUser) localStorage.setItem('mbti-match-user', JSON.stringify(currentUser));
    } catch { /* localStorage 已滿或不可用 */ }
  }, [currentUser, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('mbti-match-matches', JSON.stringify(matches));
    } catch { /* localStorage 已滿或不可用 */ }
  }, [matches, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('mbti-match-likes', JSON.stringify(likes));
    } catch { /* localStorage 已滿或不可用 */ }
  }, [likes, isHydrated]);

  // ============================
  // Auth actions
  // ============================
  const login = useCallback((name: string) => {
    const newUser: UserProfile = {
      id: 'me-' + Date.now(),
      name,
      age: 25,
      gender: 'male',
      bio: '',
      photos: [],
      mbti: {
        EI: { type: 'E', strength: 50 },
        SN: { type: 'S', strength: 50 },
        TF: { type: 'T', strength: 50 },
        JP: { type: 'J', strength: 50 },
      },
      mbtiCode: 'ESTJ',
      scenarioAnswers: [],
      preferences: {
        ageMin: 20,
        ageMax: 35,
        genderPreference: ['female', 'male', 'other'],
        region: '台北',
      },
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    setOnboardingStep(1);
    track('login');
  }, []);

  const logout = useCallback(() => {
    track('logout');
    clearAnalytics();
    setCurrentUser(null);
    setDailyCards([]);
    setMatches([]);
    setLikes([]);
    setOnboardingStep(0);
    localStorage.removeItem('mbti-match-user');
    localStorage.removeItem('mbti-match-daily');
    localStorage.removeItem('mbti-match-matches');
    localStorage.removeItem('mbti-match-likes');
    localStorage.removeItem('mochi_analytics_consent');
    if ('caches' in window) {
      caches.delete('mochi-v1').catch(() => {});
    }
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      track('profile_updated');
      const updated = { ...prev, ...updates };
      if (updates.preferences) {
        updated.preferences = { ...prev.preferences, ...updates.preferences };
      }
      if (updates.mbti) {
        updated.mbtiCode =
          updates.mbti.EI.type + updates.mbti.SN.type + updates.mbti.TF.type + updates.mbti.JP.type;
      }
      return updated;
    });
  }, []);

  // ============================
  // Cards actions
  // ============================
  const saveDailyCards = useCallback((cards: DailyCard[]) => {
    try {
      localStorage.setItem(
        'mbti-match-daily',
        JSON.stringify({ date: new Date().toDateString(), cards })
      );
    } catch { /* localStorage 已滿或不可用 */ }
  }, []);

  const refreshDailyCards = useCallback(() => {
    const user = currentUserRef.current;
    if (!user) return;
    const likedIds = likesRef.current.map(l => l.toUserId);
    const matchedIds = matchesRef.current.flatMap(m => m.users).filter(id => id !== user.id);
    const excludeIds = [...new Set([...likedIds, ...matchedIds])];
    const topMatches = getDailyMatches(user, mockUsers, excludeIds);
    const topics = getRandomTopics(5);
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const cards: DailyCard[] = topMatches.map((u, i) => ({
      user: u,
      compatibility: calculateCompatibility(user, u),
      topic: topics[i] || topics[0],
      expiresAt: expires,
      liked: false,
    }));

    setDailyCards(cards);
    localStorage.setItem(
      'mbti-match-daily',
      JSON.stringify({ date: now.toDateString(), cards })
    );
  }, []);

  const likeUser = useCallback((userId: string, topicAnswer: string): boolean => {
    const user = currentUserRef.current;
    if (!user) return false;
    if (dailyCardsRef.current.find(c => c.user.id === userId)?.liked) return false;

    const newLike: LikeAction = {
      fromUserId: user.id,
      toUserId: userId,
      topicAnswer,
      timestamp: new Date().toISOString(),
    };
    setLikes(prev => [...prev, newLike]);
    track('card_like', { targetUserId: userId });

    setDailyCards(prev => {
      const updated = prev.map(c => (c.user.id === userId ? { ...c, liked: true, topicAnswer } : c));
      saveDailyCards(updated);
      return updated;
    });

    const isMutual = Math.random() > 0.4;
    if (isMutual) {
      const card = dailyCardsRef.current.find(c => c.user.id === userId);
      const otherUser = mockUsers.find(u => u.id === userId);
      const shared = otherUser ? getSharedAnswers(user, otherUser) : [];
      const icebreaker = shared.length > 0
        ? `\n\n✨ 你們在「${shared[0].category}」都選了「${shared[0].sharedOptions[0]}」，聊聊看？`
        : '';
      const newMatch: Match = {
        id: 'match-' + Date.now(),
        users: [user.id, userId],
        topic: card?.topic || conversationTopics[0],
        topicAnswers: {
          [user.id]: topicAnswer,
          [userId]: '對方的回答（demo）',
        },
        messages: [
          {
            id: 'sys-1',
            senderId: 'system',
            text: `🎉 配對成功！你們對彼此都感興趣，開始聊天吧！${icebreaker}`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      setMatches(prev => [...prev, newMatch]);
      track('match_created', { matchedUserId: userId });
    }
    return isMutual;
  }, [saveDailyCards]);

  const skipUser = useCallback((userId: string) => {
    track('card_skip', { targetUserId: userId });
    setDailyCards(prev => {
      const updated = prev.map(c => (c.user.id === userId ? { ...c, skipped: true } : c));
      saveDailyCards(updated);
      return updated;
    });
  }, [saveDailyCards]);

  const undoSkip = useCallback((userId: string) => {
    track('card_undo', { targetUserId: userId });
    setDailyCards(prev => {
      const updated = prev.map(c => (c.user.id === userId ? { ...c, skipped: false } : c));
      saveDailyCards(updated);
      return updated;
    });
  }, [saveDailyCards]);

  // ============================
  // Matches actions
  // ============================
  const sendMessage = useCallback((matchId: string, text: string) => {
    const user = currentUserRef.current;
    if (!user) return;
    track('chat_message_sent');
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${msgCounter++}`,
      senderId: user.id,
      text,
      timestamp: new Date().toISOString(),
    };
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId ? { ...m, messages: [...m.messages, msg] } : m
      )
    );

    // Demo: auto-reply
    setTimeout(() => {
      if (matchesRef.current.length === 0) return;
      const otherUserId = matchesRef.current
        .find(m => m.id === matchId)
        ?.users.find(id => id !== user.id);
      const autoReplies = [
        '哈哈，我也這麼覺得！',
        '真的嗎？好有趣 😄',
        '我也喜歡這個！我們品味很像呢',
        '下次可以一起去試試看！',
        '你的想法好特別～',
        '對啊，我最近也在想這件事',
      ];
      const reply: ChatMessage = {
        id: `reply-${Date.now()}-${msgCounter++}`,
        senderId: otherUserId || 'unknown',
        text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        timestamp: new Date().toISOString(),
      };
      setMatches(prev =>
        prev.map(m =>
          m.id === matchId ? { ...m, messages: [...m.messages, reply] } : m
        )
      );
    }, 2000);
  }, []);

  const removeMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  }, []);

  // ============================
  // Memoized context values (prevents unnecessary re-renders)
  // ============================
  const authValue = useMemo<AuthState>(() => ({
    currentUser,
    setCurrentUser,
    isLoggedIn: !!currentUser,
    isHydrated,
    login,
    logout,
    updateProfile,
  }), [currentUser, isHydrated, login, logout, updateProfile]);

  const cardsValue = useMemo<CardsState>(() => ({
    dailyCards,
    refreshDailyCards,
    likeUser,
    skipUser,
    undoSkip,
    likes,
  }), [dailyCards, refreshDailyCards, likeUser, skipUser, undoSkip, likes]);

  const matchesValue = useMemo<MatchesState>(() => ({
    matches,
    sendMessage,
    removeMatch,
  }), [matches, sendMessage, removeMatch]);

  const onboardingValue = useMemo<OnboardingState>(() => ({
    onboardingStep,
    setOnboardingStep,
  }), [onboardingStep]);

  return (
    <AuthContext.Provider value={authValue}>
      <OnboardingContext.Provider value={onboardingValue}>
        <MatchesContext.Provider value={matchesValue}>
          <CardsContext.Provider value={cardsValue}>
            {isHydrated ? children : (
              <div style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #FAF5FF, #FDF2F8)',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: 'linear-gradient(135deg, #7C3AED, #F43F5E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <span style={{ fontSize: 28 }}>💜</span>
                </div>
                <p style={{ marginTop: 16, color: '#7C3AED', fontWeight: 600, fontSize: 14 }}>
                  載入中...
                </p>
              </div>
            )}
          </CardsContext.Provider>
        </MatchesContext.Provider>
      </OnboardingContext.Provider>
    </AuthContext.Provider>
  );
}
