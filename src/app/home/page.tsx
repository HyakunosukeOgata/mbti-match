'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { calculateCompatibility, getSharedAnswers } from '@/lib/matching';
import { mockUsers } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import PhotoGallery from '@/components/PhotoGallery';
import { Heart, Clock, MessageCircle, Sparkles, ChevronDown, Zap, X, Undo2 } from 'lucide-react';
import { track } from '@/lib/analytics';

// MBTI personality quick labels
const mbtiLabels: Record<string, { emoji: string; label: string; color: string }> = {
  INFP: { emoji: '🌙', label: '理想主義者', color: '#818CF8' },
  INFJ: { emoji: '🔮', label: '提倡者', color: '#6366F1' },
  INTP: { emoji: '🧠', label: '邏輯家', color: '#38BDF8' },
  INTJ: { emoji: '🎯', label: '策略家', color: '#6366F1' },
  ENFP: { emoji: '🌈', label: '召喚者', color: '#F59E0B' },
  ENFJ: { emoji: '🌟', label: '主人翁', color: '#10B981' },
  ENTP: { emoji: '🚀', label: '辯論家', color: '#F97316' },
  ENTJ: { emoji: '👑', label: '指揮家', color: '#EF4444' },
  ISFP: { emoji: '🎨', label: '探險家', color: '#F4A261' },
  ISFJ: { emoji: '🛡️', label: '守護者', color: '#14B8A6' },
  ISTP: { emoji: '🔧', label: '工匠', color: '#64748B' },
  ISTJ: { emoji: '📚', label: '檢查員', color: '#475569' },
  ESFP: { emoji: '🎉', label: '表演者', color: '#FF6B6B' },
  ESFJ: { emoji: '☕', label: '照顧者', color: '#F472B6' },
  ESTP: { emoji: '⚡', label: '企業家', color: '#EF4444' },
  ESTJ: { emoji: '💼', label: '總經理', color: '#E8842C' },
};

export default function HomePage() {
  const { currentUser, dailyCards, refreshDailyCards, likeUser, skipUser, undoSkip, matches } = useApp();
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, string>>({});
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [lastSkipped, setLastSkipped] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const matchAlertTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup match alert timer on unmount
  useEffect(() => {
    return () => {
      if (matchAlertTimerRef.current) clearTimeout(matchAlertTimerRef.current);
    };
  }, []);

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
      const matchId = matches.find(m => m.users.includes(userId))?.id || null;
      setMatchedUserId(userId);
      setShowMatchAlert(true);
      if (matchAlertTimerRef.current) clearTimeout(matchAlertTimerRef.current);
      matchAlertTimerRef.current = setTimeout(() => setShowMatchAlert(false), 4000);
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
    <div className="min-h-dvh pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <p className="text-sm text-text mb-1">
          {new Date().getHours() < 12 ? '🌅 早安' : new Date().getHours() < 18 ? '☀️ 午安' : '🌙 晚安'}，{currentUser.name}
        </p>
        <div className="flex justify-between items-end">
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">今日推薦</span>
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(232, 132, 44, 0.12)', color: '#A86B20' }}>
            <Clock size={12} />
            {countdown}
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {dailyCards.filter(c => !c.liked && !c.skipped).length} 位等你認識
        </p>
      </div>

      {/* Match celebration overlay */}
      {showMatchAlert && (
        <div className="fixed inset-0 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="配對成功" style={{ zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="text-center animate-bounce-in">
            {/* Floating hearts */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              {/* Ripple rings */}
              <div className="absolute inset-0 rounded-full animate-ripple-burst" style={{ border: '2px solid rgba(232, 132, 44, 0.4)' }} />
              <div className="absolute inset-0 rounded-full animate-ripple-burst" style={{ border: '2px solid rgba(255, 107, 107, 0.3)', animationDelay: '0.15s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8842C, #FF6B6B)', boxShadow: '0 0 60px var(--glow-match)' }}>
                  <Heart size={48} color="white" fill="white" className="animate-heart-burst" />
                </div>
              </div>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="absolute text-2xl" style={{
                  top: `${20 + Math.sin(i * 1.05) * 40}%`,
                  left: `${20 + Math.cos(i * 1.05) * 40}%`,
                  animation: `confetti-fall ${2 + i * 0.3}s ease-out ${i * 0.15}s forwards`,
                }}>
                  {['❤️','🧡','💛','💚','💕','✨'][i]}
                </div>
              ))}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 shimmer-text">
              配對成功！
            </h2>
            <p className="text-white/80 text-sm mb-6">
              你們互相喜歡了對方 💕
            </p>
            {matchedUserId && getMatchIdForUser(matchedUserId) && (
              <Link
                href={`/chat/${getMatchIdForUser(matchedUserId)}`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-sm no-underline animate-slide-up"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)', animationDelay: '0.3s' }}
              >
                <MessageCircle size={18} />
                開始聊天 →
              </Link>
            )}
            <button
              className="block mx-auto mt-3 text-white/60 text-xs hover:text-white/80 transition-colors"
              onClick={() => setShowMatchAlert(false)}
            >
              繼續瀏覽
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="px-6 space-y-5">
        {dailyCards.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 animate-float" style={{ boxShadow: '0 8px 40px rgba(232, 132, 44, 0.3)' }}>
              <Sparkles size={40} color="white" />
            </div>
            <p className="text-text font-bold text-xl mb-2">今日推薦準備中</p>
            <p className="text-text-secondary text-sm mb-8 leading-relaxed px-4">每天為你精選默契對象<br/>你的專屬推薦馬上就來 🧡</p>
            <button className="btn-primary !w-auto !px-10 !py-3.5 animate-pulse-ring" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '載入中...' : '✨ 探索今日推薦'}
            </button>
          </div>
        )}

        {dailyCards.filter(c => !c.skipped).map((card, idx) => {
          const isExpanded = expandedCard === card.user.id;
          const compat = calculateCompatibility(currentUser, card.user);
          const mbtiInfo = mbtiLabels[card.user.mbtiCode] || mbtiLabels.ESTJ;

          return (
            <div
              key={card.user.id}
              className="rounded-3xl overflow-hidden animate-slide-up"
              style={{
                animationDelay: `${idx * 0.08}s`,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 16px rgba(232, 132, 44, 0.08), 0 8px 32px rgba(232, 132, 44, 0.06)',
              }}
            >
              {/* Photo + overlay info */}
              <div
                className="relative cursor-pointer"
                onClick={() => setExpandedCard(isExpanded ? null : card.user.id)}
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={card.user.photos[0]}
                    alt={card.user.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                {/* Gradient overlays — top subtle + bottom strong for text readability */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 20%, transparent 45%, rgba(0,0,0,0.7) 100%)' }} />
                {/* Info on photo */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-4" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-2.5 mb-1.5">
                        <span className="text-white font-bold text-2xl tracking-tight">{card.user.name}</span>
                        <span className="text-white/70 text-lg font-medium">{card.user.age}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="mbti-badge !text-[10px] !py-0.5 !px-2.5">{card.user.mbtiCode}</span>
                        <span className="text-white/80 text-xs font-medium">
                          {mbtiInfo.emoji} {mbtiInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className={`compat-ring !w-12 !h-12 !text-sm !font-bold ${getCompatClass(compat)}`}>
                      {compat}<span className="text-[9px] font-semibold opacity-80">%</span>
                    </div>
                  </div>
                </div>
                {/* Liked badge */}
                {card.liked && (
                  <div className="absolute top-3 right-3 animate-scale-in">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 107, 107, 0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)' }}>
                      <Heart size={22} fill="#FF6B6B" color="#FF6B6B" />
                    </div>
                  </div>
                )}
                {/* Expand indicator */}
                {!card.liked && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', transform: isExpanded ? 'rotate(180deg)' : undefined }}>
                    <ChevronDown size={18} color="white" />
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {!card.liked && (
                <div className={`card-expand-content ${isExpanded ? 'expanded' : ''}`}>
                <div>
                {isExpanded && (
                <div className="p-5 pt-4 space-y-4">
                  {/* Photo carousel */}
                  {card.user.photos.length > 1 && (
                    <div className="-mx-1">
                      <PhotoGallery photos={card.user.photos} name={card.user.name} mode="carousel" />
                    </div>
                  )}

                  {/* Bio */}
                  <p className="text-sm text-text leading-relaxed">{card.user.bio}</p>

                  {/* Compat section */}
                  <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(232,132,44,0.06), rgba(255,107,107,0.06))', border: '1px solid rgba(232,132,44,0.08)' }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        <span className="text-sm font-bold">配對度</span>
                      </div>
                      <span className="text-sm font-bold gradient-text">{compat}%</span>
                    </div>
                    <div className="progress-bar mb-3" role="progressbar" aria-valuenow={compat} aria-valuemin={0} aria-valuemax={100} aria-label={`配對度 ${compat}%`}>
                      <div className="progress-bar-fill" style={{ width: `${compat}%` }} />
                    </div>
                    {(() => {
                      const shared = getSharedAnswers(currentUser, card.user);
                      if (shared.length === 0) return (
                        <p className="text-xs text-text-secondary">基於價值觀回答和 MBTI 相容度</p>
                      );
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {shared.slice(0, 3).map((s, i) => (
                            <span key={i} className="pill text-[11px]">{s.category}</span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Topic */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1">
                      <MessageCircle size={12} /> 今日話題
                    </p>
                    <div className="p-3.5 rounded-2xl" style={{ background: 'rgba(232,132,44,0.05)', border: '1px solid rgba(232,132,44,0.1)' }}>
                      <p className="text-sm font-medium leading-relaxed">{card.topic.text}</p>
                    </div>
                  </div>

                  {/* Input + Actions */}
                  <textarea
                    value={topicAnswers[card.user.id] || ''}
                    onChange={(e) => setTopicAnswers(prev => ({ ...prev, [card.user.id]: e.target.value }))}
                    placeholder="寫下你的回答，讓 TA 認識你 ✍️"
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-3 mt-1">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-2xl transition-all active:scale-95"
                      style={{
                        padding: '14px 0',
                        background: 'rgba(232, 132, 44, 0.06)',
                        border: '1.5px solid rgba(232, 132, 44, 0.15)',
                        color: 'var(--text-secondary)',
                      }}
                      onClick={() => handleSkip(card.user.id)}
                    >
                      <X size={16} /> 跳過
                    </button>
                    <button
                      className="btn-primary flex-[1.8] flex items-center justify-center gap-1.5 text-sm !py-3.5 !rounded-2xl"
                      onClick={() => handleLike(card.user.id)}
                      disabled={!topicAnswers[card.user.id]?.trim()}
                    >
                      <Heart size={16} /> 送出喜歡
                    </button>
                  </div>
                </div>
                )}
                </div>
                </div>
              )}

              {/* Matched */}
              {card.liked && !!getMatchIdForUser(card.user.id) && (
                <div className="p-4">
                  <Link
                    href={`/chat/${getMatchIdForUser(card.user.id)}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white no-underline animate-scale-in"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                  >
                    🎉 配對成功！去聊天 →
                  </Link>
                </div>
              )}

              {/* Liked but not matched */}
              {card.liked && !getMatchIdForUser(card.user.id) && (
                <div className="p-4">
                  <div className="flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(232,132,44,0.08), rgba(255,107,107,0.08))', border: '1px solid rgba(232,132,44,0.12)' }}>
                    <Heart size={14} fill="var(--primary)" color="var(--primary)" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>已送出喜歡</span>
                    <span className="text-xs text-text-secondary ml-1">等待回應中</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skip undo toast */}
      {lastSkipped && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="status" aria-live="polite">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg" style={{ background: 'rgba(30,30,30,0.9)', backdropFilter: 'blur(12px)' }}>
            <span className="text-white text-sm">已跳過</span>
            <button
              className="text-sm font-bold flex items-center gap-1"
              style={{ color: '#F4B183' }}
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
