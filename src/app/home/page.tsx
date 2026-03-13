'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { calculateCompatibility, getSharedAnswers } from '@/lib/matching';
import { mockUsers } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import { Heart, Clock, MessageCircle, Sparkles, ChevronDown, ChevronUp, Send, Zap, X, Undo2 } from 'lucide-react';
import { track } from '@/lib/analytics';

export default function HomePage() {
  const { currentUser, dailyCards, refreshDailyCards, likeUser, skipUser, undoSkip, matches } = useApp();
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, string>>({});
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [lastSkipped, setLastSkipped] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (!currentUser.onboardingComplete) {
      router.replace('/onboarding/mbti');
      return;
    }
    track('page_view', { page: 'home' });
    if (dailyCards.length === 0) {
      refreshDailyCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, router, refreshDailyCards]);

  useEffect(() => {
    if (dailyCards.length === 0) return;
    const updateCountdown = () => {
      const expires = new Date(dailyCards[0]?.expiresAt);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('已過期');
        refreshDailyCards();
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${mins}m`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [dailyCards, refreshDailyCards]);

  if (!currentUser) return null;

  const handleSkip = (userId: string) => {
    skipUser(userId);
    setExpandedCard(null);
    setLastSkipped(userId);
    setTimeout(() => setLastSkipped(prev => prev === userId ? null : prev), 4000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refreshDailyCards();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleLike = (userId: string) => {
    const answer = topicAnswers[userId];
    if (!answer?.trim()) return;
    const matched = likeUser(userId, answer);
    if (matched) {
      setShowMatchAlert(true);
      setTimeout(() => setShowMatchAlert(false), 3000);
    }
  };

  const getMatchIdForUser = (userId: string) => {
    return matches.find(m => m.users.includes(userId))?.id;
  };

  const getCompatClass = (score: number) => {
    if (score >= 70) return 'compat-high';
    if (score >= 40) return 'compat-medium';
    return 'compat-low';
  };

  return (
    <div className="min-h-dvh pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-2xl font-extrabold">
              <span className="gradient-text">今日推薦</span> ✨
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {dailyCards.filter(c => !c.liked && !c.skipped).length} 個人等你認識
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
            <Clock size={13} />
            <span>{countdown}</span>
          </div>
        </div>
      </div>

      {/* Match alert */}
      {showMatchAlert && (
        <div className="mx-6 mb-4 p-4 rounded-2xl animate-scale-in glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))' }}>
          <p className="text-center text-sm font-bold text-success flex items-center justify-center gap-2">
            🎉 配對成功！快去聊天吧
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="px-6 space-y-4">
        {dailyCards.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-5 animate-float" style={{ boxShadow: '0 8px 30px rgba(124, 58, 237, 0.25)' }}>
              <Sparkles size={36} color="white" />
            </div>
            <p className="text-text-secondary text-lg font-medium mb-1">等等，正在找人中...</p>
            <p className="text-text-secondary text-sm mb-6">你的命中註定可能就在這裡 💜</p>
            <button className="btn-primary !w-auto !px-8" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '載入中...' : '✨ 探索今日推薦'}
            </button>
          </div>
        )}

        {dailyCards.filter(c => !c.skipped).map((card, idx) => {
          const isExpanded = expandedCard === card.user.id;
          const compat = calculateCompatibility(currentUser, card.user);

          return (
            <div
              key={card.user.id}
              className="card animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedCard(isExpanded ? null : card.user.id)}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)' }}>
                    <img
                      src={card.user.photos[0]}
                      alt={card.user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`compat-ring absolute -bottom-1 -right-1 !w-6 !h-6 !text-[10px] ${getCompatClass(compat)}`}>
                    {compat}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-lg">{card.user.name}</span>
                    <span className="text-text-secondary text-sm">{card.user.age}</span>
                  </div>
                  <span className="mbti-badge text-xs">{card.user.mbtiCode}</span>
                </div>

                <div className="text-text-secondary">
                  {card.liked ? (
                    <Heart size={24} fill="#F43F5E" color="#F43F5E" />
                  ) : isExpanded ? (
                    <ChevronUp size={22} />
                  ) : (
                    <ChevronDown size={22} />
                  )}
                </div>
              </div>

              {isExpanded && !card.liked && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">關於我</p>
                    <p className="text-sm leading-relaxed">{card.user.bio}</p>
                  </div>

                  <div className="mb-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(244, 63, 94, 0.05))' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-primary" />
                      <p className="text-sm font-bold">配對度 {compat}%</p>
                    </div>
                    <div className="progress-bar mb-3">
                      <div className="progress-bar-fill" style={{ width: `${compat}%` }} />
                    </div>
                    {(() => {
                      const shared = getSharedAnswers(currentUser, card.user);
                      if (shared.length === 0) return (
                        <p className="text-xs text-text-secondary">
                          基於你們的價值觀回答和 MBTI 相容度
                        </p>
                      );
                      return (
                        <div className="space-y-2">
                          <p className="text-xs text-text-secondary mb-1">你們的共同選擇</p>
                          {shared.slice(0, 3).map((s, i) => (
                            <div key={i} className="text-xs">
                              <span className="text-text-secondary">{s.category}：</span>
                              {s.sharedOptions.map((opt, j) => (
                                <span key={j} className="inline-block mt-1 mr-1 px-2 py-0.5 rounded bg-white border border-border text-text">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 話題 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle size={14} className="text-primary" />
                      <p className="text-sm font-bold">💬 今日話題</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-border" style={{ background: 'rgba(124, 58, 237, 0.03)' }}>
                      <p className="text-sm font-medium">{card.topic.text}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={topicAnswers[card.user.id] || ''}
                      onChange={(e) =>
                        setTopicAnswers(prev => ({ ...prev, [card.user.id]: e.target.value }))
                      }
                      placeholder="寫下你的回答，和 TA 開始對話 ✍️"
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <button
                      className="btn-primary flex items-center justify-center gap-2 text-sm"
                      onClick={() => handleLike(card.user.id)}
                      disabled={!topicAnswers[card.user.id]?.trim()}
                    >
                      <Heart size={16} />
                      送出喜歡
                      <Send size={14} />
                    </button>
                    <button
                      className="btn-secondary flex items-center justify-center gap-2 text-sm"
                      onClick={() => handleSkip(card.user.id)}
                    >
                      <X size={16} />
                      跳過
                    </button>
                  </div>
                </div>
              )}

              {card.liked && !!getMatchIdForUser(card.user.id) && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Link
                    href={`/chat/${getMatchIdForUser(card.user.id)}`}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white no-underline animate-scale-in"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                  >
                    🎉 配對成功！去聊天 →
                  </Link>
                </div>
              )}

              {card.liked && !getMatchIdForUser(card.user.id) && (
                <div className="mt-3 pt-3 border-t border-border text-center">
                  <p className="text-sm text-text-secondary flex items-center justify-center gap-1">
                    💜 已送出喜歡
                  </p>
                  <p className="text-xs text-text-secondary mt-1 opacity-60">
                    對方會在推薦中看到你，有緣自然會相遇 ✨
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skip undo toast */}
      {lastSkipped && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg" style={{ background: 'rgba(30,30,30,0.9)', backdropFilter: 'blur(12px)' }}>
            <span className="text-white text-sm">已跳過</span>
            <button
              className="text-sm font-bold flex items-center gap-1"
              style={{ color: '#A78BFA' }}
              onClick={() => { undoSkip(lastSkipped); setLastSkipped(null); }}
            >
              <Undo2 size={14} /> 復原
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
