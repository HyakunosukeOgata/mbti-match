'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Match, DailyCard, LikeAction, ConversationTopic, ChatMessage } from './types';
import { mockUsers, conversationTopics } from './mock-data';
import { calculateCompatibility, getDailyMatches } from './matching';

interface AppState {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (name: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  dailyCards: DailyCard[];
  refreshDailyCards: () => void;
  likeUser: (userId: string, topicAnswer: string) => boolean;
  matches: Match[];
  sendMessage: (matchId: string, text: string) => void;
  likes: LikeAction[];
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}

function getRandomTopics(count: number): ConversationTopic[] {
  const shuffled = [...conversationTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

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

  // 載入 localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mbti-match-user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      if (user.onboardingComplete) {
        setOnboardingStep(4); // 已完成 onboarding
      }
    }
    const savedMatches = localStorage.getItem('mbti-match-matches');
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    const savedLikes = localStorage.getItem('mbti-match-likes');
    if (savedLikes) setLikes(JSON.parse(savedLikes));
    const savedCards = localStorage.getItem('mbti-match-daily');
    if (savedCards) {
      const parsed = JSON.parse(savedCards);
      // 檢查是否是今天的卡片
      if (parsed.date === new Date().toDateString()) {
        setDailyCards(parsed.cards);
      }
    }
    setIsHydrated(true);
  }, []);

  // 儲存到 localStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('mbti-match-user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('mbti-match-matches', JSON.stringify(matches));
  }, [matches]);
  useEffect(() => {
    localStorage.setItem('mbti-match-likes', JSON.stringify(likes));
  }, [likes]);

  const login = (name: string) => {
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
  };

  const logout = () => {
    setCurrentUser(null);
    setDailyCards([]);
    setMatches([]);
    setLikes([]);
    setOnboardingStep(0);
    localStorage.removeItem('mbti-match-user');
    localStorage.removeItem('mbti-match-daily');
    localStorage.removeItem('mbti-match-matches');
    localStorage.removeItem('mbti-match-likes');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    if (updates.mbti) {
      updated.mbtiCode =
        updates.mbti.EI.type + updates.mbti.SN.type + updates.mbti.TF.type + updates.mbti.JP.type;
    }
    setCurrentUser(updated);
  };

  const refreshDailyCards = () => {
    if (!currentUser) return;
    const topMatches = getDailyMatches(currentUser, mockUsers);
    const topics = getRandomTopics(5);
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const cards: DailyCard[] = topMatches.map((user, i) => ({
      user,
      compatibility: calculateCompatibility(currentUser, user),
      topic: topics[i] || topics[0],
      expiresAt: expires,
      liked: false,
    }));

    setDailyCards(cards);
    localStorage.setItem(
      'mbti-match-daily',
      JSON.stringify({ date: now.toDateString(), cards })
    );
  };

  const likeUser = (userId: string, topicAnswer: string): boolean => {
    if (!currentUser) return false;

    const newLike: LikeAction = {
      fromUserId: currentUser.id,
      toUserId: userId,
      topicAnswer,
      timestamp: new Date().toISOString(),
    };
    const updatedLikes = [...likes, newLike];
    setLikes(updatedLikes);

    // 標記 dailyCard 為已喜歡
    setDailyCards(prev =>
      prev.map(c => (c.user.id === userId ? { ...c, liked: true, topicAnswer } : c))
    );

    // Demo 模擬：50% 機率對方也喜歡你 → 產生配對
    const isMutual = Math.random() > 0.4;
    if (isMutual) {
      const card = dailyCardsRef.current.find(c => c.user.id === userId);
      const newMatch: Match = {
        id: 'match-' + Date.now(),
        users: [currentUser.id, userId],
        topic: card?.topic || conversationTopics[0],
        topicAnswers: {
          [currentUser.id]: topicAnswer,
          [userId]: '對方的回答（demo）',
        },
        messages: [
          {
            id: 'sys-1',
            senderId: 'system',
            text: '🎉 配對成功！你們對彼此都感興趣，開始聊天吧！',
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      setMatches(prev => [...prev, newMatch]);
    }
    return isMutual;
  };

  const sendMessage = (matchId: string, text: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
    };
    setMatches(prev =>
      prev.map(m =>
        m.id === matchId ? { ...m, messages: [...m.messages, msg] } : m
      )
    );

    // Demo: 模擬對方自動回覆
    setTimeout(() => {
      const otherUserId = matchesRef.current
        .find(m => m.id === matchId)
        ?.users.find(id => id !== currentUser.id);
      const otherUser = mockUsers.find(u => u.id === otherUserId);
      const autoReplies = [
        '哈哈，我也這麼覺得！',
        '真的嗎？好有趣 😄',
        '我也喜歡這個！我們品味很像呢',
        '下次可以一起去試試看！',
        '你的想法好特別～',
        '對啊，我最近也在想這件事',
      ];
      const reply: ChatMessage = {
        id: 'msg-' + Date.now(),
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
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isLoggedIn: !!currentUser,
        isHydrated,
        login,
        logout,
        updateProfile,
        dailyCards,
        refreshDailyCards,
        likeUser,
        matches,
        sendMessage,
        likes,
        onboardingStep,
        setOnboardingStep,
      }}
    >
      {isHydrated ? children : null}
    </AppContext.Provider>
  );
}
