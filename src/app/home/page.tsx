'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { calculateCompatibility, getCompatibilityInsight, getSharedValues } from '@/lib/matching';
import BottomNav from '@/components/BottomNav';
import PhotoGallery from '@/components/PhotoGallery';
import { Heart, Clock, MessageCircle, Sparkles, ChevronDown, Zap, X, Send } from 'lucide-react';
import { track } from '@/lib/analytics';
import PersonalityRadar from '@/components/PersonalityRadar';

export default function HomePage() {
  const { currentUser, authReady, dailyCards, refreshDailyCards, likeUser, skipUser, matches, session } = useApp();
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, string>>({});
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [matchedChatId, setMatchedChatId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');
  const [skipNotice, setSkipNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [matchQuickMsg, setMatchQuickMsg] = useState('');
  const matchAlertTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Photo carousel state per card
  const [cardPhotoIndex, setCardPhotoIndex] = useState<Record<string, number>>({});
  // Swipe state
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [swipingCardId, setSwipingCardId] = useState<string | null>(null);
  const [swipeExiting, setSwipeExiting] = useState<'left' | 'right' | null>(null);
  const swipeStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeLocked = useRef<'horizontal' | 'vertical' | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (!currentUser.onboardingComplete) {
      router.replace(currentUser.aiPersonality ? '/personality' : '/onboarding/ai-chat');
      return;
    }
    track('page_view', { page: 'home' });
    if (dailyCards.length === 0 && session?.access_token) {
      refreshDailyCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, currentUser, router, refreshDailyCards, dailyCards.length, session?.access_token]);

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

  if (!authReady || !currentUser) return null;

  const trackProfileView = async (targetDbId: string) => {
    if (!session?.access_token) return;
    fetch('/api/social/profile-views', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserDbId: targetDbId }),
    }).catch(() => undefined);
  };

  const handleSkip = async (userId: string) => {
    await skipUser(userId);
    setExpandedCard(null);
    setSkipNotice('已略過，今天不會再看到這位對象');
    setTimeout(() => setSkipNotice(''), 2500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDailyCards();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleLike = async (userId: string) => {
    const answer = topicAnswers[userId];
    if (!answer?.trim()) return;
    const matchId = await likeUser(userId, answer);
    if (matchId) {
      setMatchedUserId(userId);
      setMatchedChatId(matchId);
      setShowMatchAlert(true);
      if (matchAlertTimerRef.current) clearTimeout(matchAlertTimerRef.current);
      matchAlertTimerRef.current = setTimeout(() => setShowMatchAlert(false), 4000);
    }
  };

  const applyStarter = (userId: string, starter: string) => {
    setTopicAnswers((prev) => ({
      ...prev,
      [userId]: prev[userId]?.trim() ? `${prev[userId].trim()}\n${starter}` : starter,
    }));
  };

  // --- Card photo carousel ---
  const handlePhotoTap = (userId: string, photos: string[], e: React.MouseEvent) => {
    // If card is expanded or has 1 photo, fall through to expand/collapse
    if (photos.length <= 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const third = rect.width / 3;
    const current = cardPhotoIndex[userId] || 0;
    if (tapX < third) {
      // Tap left third → prev photo
      setCardPhotoIndex(prev => ({ ...prev, [userId]: Math.max(0, current - 1) }));
      e.stopPropagation();
    } else if (tapX > third * 2) {
      // Tap right third → next photo
      setCardPhotoIndex(prev => ({ ...prev, [userId]: Math.min(photos.length - 1, current + 1) }));
      e.stopPropagation();
    }
    // Middle third → fall through to expand/collapse
  };

  // --- Swipe gestures ---
  const handleSwipeTouchStart = useCallback((cardId: string, e: React.TouchEvent) => {
    // Don't swipe if card is expanded (user is reading details)
    if (expandedCard === cardId) return;
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
    swipeLocked.current = null;
    setSwipingCardId(cardId);
  }, [expandedCard]);

  const handleSwipeTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStart.current || !swipingCardId) return;
    const dx = e.touches[0].clientX - swipeStart.current.x;
    const dy = e.touches[0].clientY - swipeStart.current.y;
    // Lock direction after 10px movement
    if (!swipeLocked.current) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeLocked.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
    }
    if (swipeLocked.current === 'horizontal') {
      e.preventDefault();
      setSwipeDelta(dx);
    }
  }, [swipingCardId]);

  const handleSwipeTouchEnd = useCallback(() => {
    if (!swipeStart.current || !swipingCardId) {
      setSwipeDelta(0);
      setSwipingCardId(null);
      return;
    }
    const threshold = 100;
    if (swipeLocked.current === 'horizontal' && Math.abs(swipeDelta) > threshold) {
      const direction = swipeDelta > 0 ? 'right' : 'left';
      setSwipeExiting(direction);
      // Animate out then execute action
      setTimeout(() => {
        if (direction === 'left') {
          handleSkip(swipingCardId);
        }
        // Right swipe → expand card to enter answer (can't auto-like without answer)
        if (direction === 'right') {
          setExpandedCard(swipingCardId);
        }
        setSwipeExiting(null);
        setSwipeDelta(0);
        setSwipingCardId(null);
      }, 250);
    } else {
      setSwipeDelta(0);
      setSwipingCardId(null);
    }
    swipeStart.current = null;
    swipeLocked.current = null;
  }, [swipingCardId, swipeDelta]);

  // --- Quick message from match overlay ---
  const handleMatchQuickSend = async () => {
    if (!matchQuickMsg.trim() || !matchedChatId) return;
    try {
      await fetch('/api/social/messages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: matchedChatId, text: matchQuickMsg.trim(), type: 'text' }),
      });
      setMatchQuickMsg('');
      setShowMatchAlert(false);
      router.push(`/chat/${matchedChatId}`);
    } catch {
      // fallback: just navigate
      router.push(`/chat/${matchedChatId}`);
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
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255, 140, 107, 0.12)', color: '#A86B20' }}>
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
          <div className="text-center animate-bounce-in px-6 w-full max-w-sm">
            {/* Floating hearts */}
            <div className="relative w-32 h-32 mx-auto mb-5">
              {/* Ripple rings */}
              <div className="absolute inset-0 rounded-full animate-ripple-burst" style={{ border: '2px solid rgba(255, 140, 107, 0.4)' }} />
              <div className="absolute inset-0 rounded-full animate-ripple-burst" style={{ border: '2px solid rgba(255, 107, 107, 0.3)', animationDelay: '0.15s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF8C6B, #FF6B8A)', boxShadow: '0 0 60px var(--glow-match)' }}>
                  <Heart size={40} color="white" fill="white" className="animate-heart-burst" />
                </div>
              </div>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="absolute text-xl" style={{
                  top: `${20 + Math.sin(i * 1.05) * 40}%`,
                  left: `${20 + Math.cos(i * 1.05) * 40}%`,
                  animation: `confetti-fall ${2 + i * 0.3}s ease-out ${i * 0.15}s forwards`,
                }}>
                  {['❤️','🧡','💛','💚','💕','✨'][i]}
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 shimmer-text">
              配對成功！
            </h2>
            <p className="text-white/80 text-sm mb-5">
              你們互相喜歡了對方 💕
            </p>

            {/* Quick message input */}
            {matchedChatId && (
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={matchQuickMsg}
                    onChange={e => setMatchQuickMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleMatchQuickSend()}
                    placeholder="說點什麼打個招呼 👋"
                    className="flex-1 !rounded-full !py-3 !px-4 !text-sm !border-0"
                    style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={handleMatchQuickSend}
                    disabled={!matchQuickMsg.trim()}
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
                    style={{ background: matchQuickMsg.trim() ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.2)' }}
                  >
                    <Send size={18} color="white" />
                  </button>
                </div>
                <Link
                  href={`/chat/${matchedChatId}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-semibold text-sm no-underline"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}
                  onClick={() => setShowMatchAlert(false)}
                >
                  <MessageCircle size={16} />
                  開始聊天 →
                </Link>
              </div>
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
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 animate-float" style={{ boxShadow: '0 8px 40px rgba(255, 140, 107, 0.3)' }}>
              <Sparkles size={40} color="white" />
            </div>
            <p className="text-text font-bold text-xl mb-2">今日推薦準備中</p>
            <p className="text-text-secondary text-sm mb-4 leading-relaxed px-4">每天為你精選默契對象<br/>你的專屬推薦馬上就來 🧡</p>
            <button className="btn-primary !w-auto !px-10 !py-3.5 animate-pulse-ring" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '載入中...' : '✨ 載入今日推薦'}
            </button>
            <div className="mt-8 p-4 rounded-2xl mx-2" style={{ background: 'rgba(255,140,107,0.05)' }}>
              <p className="text-xs text-text-secondary leading-relaxed">
                💡 推薦用完了？試試這些方法讓更多人看到你：
              </p>
              <div className="mt-3 space-y-2 text-left">
                <p className="text-xs text-text">📸 上傳更多照片，展現不同面向</p>
                <p className="text-xs text-text">✏️ 豐富你的自我介紹</p>
                <p className="text-xs text-text">🔔 明天同一時間回來，會有新的推薦</p>
              </div>
            </div>
          </div>
        )}

        {/* Card stack container */}
        {dailyCards.filter(c => !c.skipped).length > 0 && (
          <div className="relative" style={{ minHeight: 480 }}>
            {/* Stack preview: show next 1-2 cards peeking behind */}
            {dailyCards.filter(c => !c.skipped && !c.liked).slice(1, 3).reverse().map((card, peekIdx) => {
              const depth = peekIdx === 0 ? 2 : 1; // 2 = furthest back
              return (
                <div
                  key={`peek-${card.user.id}`}
                  className="absolute inset-x-0 top-0 rounded-3xl overflow-hidden pointer-events-none"
                  style={{
                    transform: `scale(${1 - depth * 0.04}) translateY(${depth * 10}px)`,
                    opacity: 0.5 + (1 - depth * 0.15),
                    filter: `blur(${depth}px)`,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    height: 420,
                    zIndex: 10 - depth,
                  }}
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={card.user.photos[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            })}

            {/* Active cards */}
            {dailyCards.filter(c => !c.skipped).map((card, idx) => {
          const isExpanded = expandedCard === card.user.id;
          const compat = calculateCompatibility(currentUser, card.user);
          const insight = getCompatibilityInsight(currentUser, card.user);
          const isSwiping = swipingCardId === card.user.id;
          const isExiting = swipeExiting && swipingCardId === card.user.id;
          const currentPhotoIdx = cardPhotoIndex[card.user.id] || 0;
          const photos = card.user.photos;
          const swipeRotation = isSwiping ? swipeDelta * 0.06 : 0;
          const swipeOpacity = isSwiping ? Math.max(0, Math.min(1, Math.abs(swipeDelta) / 100)) : 0;

          return (
            <div
              key={card.user.id}
              className="card rounded-3xl overflow-hidden"
              style={{
                position: idx === 0 && !card.liked ? 'relative' : undefined,
                zIndex: idx === 0 ? 20 : 10 - idx,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 16px rgba(255, 140, 107, 0.08), 0 8px 32px rgba(255, 140, 107, 0.06)',
                transform: isExiting
                  ? `translateX(${swipeExiting === 'left' ? '-120%' : '120%'}) rotate(${swipeExiting === 'left' ? '-15' : '15'}deg)`
                  : isSwiping
                  ? `translateX(${swipeDelta}px) rotate(${swipeRotation}deg)`
                  : undefined,
                transition: isExiting ? 'transform 0.25s ease-out' : isSwiping ? 'none' : 'transform 0.3s ease',
                marginBottom: idx < dailyCards.filter(c => !c.skipped).length - 1 ? 20 : 0,
              }}
              onTouchStart={!card.liked ? (e) => handleSwipeTouchStart(card.user.id, e) : undefined}
              onTouchMove={!card.liked && isSwiping ? handleSwipeTouchMove : undefined}
              onTouchEnd={!card.liked && isSwiping ? handleSwipeTouchEnd : undefined}
            >
              {/* Swipe overlay indicators */}
              {isSwiping && !isExiting && (
                <>
                  {/* LIKE indicator (right swipe) */}
                  <div className="absolute top-6 left-6 z-30 pointer-events-none" style={{
                    opacity: swipeDelta > 30 ? swipeOpacity : 0,
                    transform: `scale(${0.5 + swipeOpacity * 0.5}) rotate(-15deg)`,
                    transition: 'opacity 0.1s',
                  }}>
                    <div className="px-4 py-2 rounded-xl border-3 font-black text-2xl" style={{ borderColor: '#10B981', color: '#10B981', borderWidth: 3 }}>
                      LIKE ❤️
                    </div>
                  </div>
                  {/* SKIP indicator (left swipe) */}
                  <div className="absolute top-6 right-6 z-30 pointer-events-none" style={{
                    opacity: swipeDelta < -30 ? swipeOpacity : 0,
                    transform: `scale(${0.5 + swipeOpacity * 0.5}) rotate(15deg)`,
                    transition: 'opacity 0.1s',
                  }}>
                    <div className="px-4 py-2 rounded-xl border-3 font-black text-2xl" style={{ borderColor: '#FF5A5A', color: '#FF5A5A', borderWidth: 3 }}>
                      SKIP ✕
                    </div>
                  </div>
                </>
              )}

              {/* Photo section with tap-to-navigate carousel */}
              <div
                className="relative cursor-pointer"
                onClick={(e) => {
                  if (photos.length > 1) {
                    handlePhotoTap(card.user.id, photos, e);
                    // Only expand/collapse on middle third tap
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const tapX = e.clientX - rect.left;
                    const third = rect.width / 3;
                    if (tapX < third || tapX > third * 2) return;
                  }
                  const willExpand = expandedCard !== card.user.id;
                  setExpandedCard(willExpand ? card.user.id : null);
                  if (willExpand && card.user.dbId) {
                    trackProfileView(card.user.dbId);
                  }
                }}
              >
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img
                    src={photos[currentPhotoIdx] || photos[0]}
                    alt={card.user.name}
                    className="w-full h-full object-cover transition-opacity duration-200"
                    draggable={false}
                  />
                </div>
                {/* Photo progress dots */}
                {photos.length > 1 && (
                  <div className="absolute top-3 inset-x-3 flex gap-1 z-20">
                    {photos.map((_, i) => (
                      <div key={i} className="flex-1 h-[3px] rounded-full transition-all duration-200" style={{
                        background: i === currentPhotoIdx ? 'white' : 'rgba(255,255,255,0.4)',
                        boxShadow: i === currentPhotoIdx ? '0 0 4px rgba(0,0,0,0.3)' : undefined,
                      }} />
                    ))}
                  </div>
                )}
                {/* Gradient overlays — top subtle + bottom strong for text readability */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 20%, transparent 45%, rgba(0,0,0,0.7) 100%)' }} />
                {/* Info on photo */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-4" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-2.5 mb-1.5">
                        <span className="text-white font-bold text-2xl tracking-tight">{card.user.name}</span>
                        {!card.user.hideAge && <span className="text-white/70 text-lg font-medium">{card.user.age}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {card.user.aiPersonality?.values.slice(0, 2).map((v, i) => (
                          <span key={i} className="personality-badge !text-[10px] !py-0.5 !px-2.5">{v}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`compat-ring ${getCompatClass(compat)}`}>
                      {compat}%
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

              {/* Bio + Compat + Recommendation reasons — always visible below photo */}
              {!card.liked && (
                <div className="px-5 py-4 space-y-3">
                  {/* Bio */}
                  <p className="text-sm text-text leading-relaxed">{card.user.bio}</p>

                  {/* Compat tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-primary" />
                      <span className="text-xs font-semibold gradient-text">{compat}% 契合</span>
                    </div>
                    {(() => {
                      const shared = getSharedValues(currentUser, card.user);
                      return shared.slice(0, 2).map((v, i) => (
                        <span key={i} className="pill text-[11px]">{v}</span>
                      ));
                    })()}
                  </div>

                  {/* Recommendation reasons — visible without expanding */}
                  {card.recommendationReasons?.reasons && card.recommendationReasons.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {card.recommendationReasons.reasons.slice(0, 2).map((reason) => (
                        <span key={reason} className="inline-flex items-center gap-1 text-xs py-1.5 px-3 rounded-full font-medium" style={{ background: 'rgba(255,140,107,0.08)', color: 'var(--primary-dark)' }}>
                          💡 {reason}
                        </span>
                      ))}
                    </div>
                  )}
                  {!card.recommendationReasons?.reasons?.length && insight.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {insight.strengths.slice(0, 2).map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 text-xs py-1.5 px-3 rounded-full font-medium" style={{ background: 'rgba(255,140,107,0.08)', color: 'var(--primary-dark)' }}>
                          ✨ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expanded details — topic + actions */}
              {!card.liked && (
                <div className={`card-expand-content ${isExpanded ? 'expanded' : ''}`}>
                <div>
                {isExpanded && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Photo carousel */}
                  {card.user.photos.length > 1 && (
                    <div className="-mx-1">
                      <PhotoGallery photos={card.user.photos} name={card.user.name} mode="carousel" />
                    </div>
                  )}

                  {/* Detailed compat */}
                  <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,140,107,0.06), rgba(255,107,107,0.06))', border: '1px solid rgba(255,140,107,0.08)' }}>
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
                    <p className="text-sm font-medium text-text mb-3">{insight.summary}</p>
                    {(() => {
                      const shared = getSharedValues(currentUser, card.user);
                      if (shared.length === 0) return (
                        <p className="text-xs text-text-secondary">基於個性分析的配對結果</p>
                      );
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {shared.slice(0, 3).map((v, i) => (
                            <span key={i} className="pill text-[11px]">{v}</span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Personality Radar */}
                  {card.user.aiPersonality?.scoringFeatures && (
                    <div className="p-4 rounded-2xl" style={{ background: '#FFFDFC', border: '1px solid rgba(255,140,107,0.08)' }}>
                      <p className="text-xs font-semibold text-text-secondary mb-3 flex items-center gap-1">
                        <Sparkles size={11} /> 個性雷達
                      </p>
                      <PersonalityRadar features={card.user.aiPersonality.scoringFeatures} />
                    </div>
                  )}

                  <div className="p-4 rounded-2xl space-y-3" style={{ background: '#FFFDFC', border: '1px solid rgba(255,140,107,0.08)' }}>
                    {/* 推薦理由 (from Kin) */}
                    {card.recommendationReasons?.reasons && card.recommendationReasons.reasons.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1">
                          <Sparkles size={11} /> 為什麼推薦你們
                        </p>
                        <div className="space-y-1.5">
                          {card.recommendationReasons.reasons.map((reason) => (
                            <p key={reason} className="text-sm text-text leading-relaxed">💡 {reason}</p>
                          ))}
                        </div>
                        {card.recommendationReasons.caution && (
                          <p className="text-xs text-text-secondary mt-2 leading-relaxed">⚠️ {card.recommendationReasons.caution}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-1.5">默契亮點</p>
                      <div className="space-y-1.5">
                        {insight.strengths.map((item) => (
                          <p key={item} className="text-sm text-text leading-relaxed">• {item}</p>
                        ))}
                      </div>
                    </div>
                    {insight.watchouts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-1.5">先知道會更順</p>
                        <div className="space-y-1.5">
                          {insight.watchouts.map((item) => (
                            <p key={item} className="text-sm text-text-secondary leading-relaxed">• {item}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {insight.sharedHighlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {insight.sharedHighlights.map((item) => (
                          <span key={item} className="pill text-[11px]">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Topic */}
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1">
                      <MessageCircle size={12} /> 今日話題
                    </p>
                    <div className="p-3.5 rounded-2xl" style={{ background: 'rgba(255,140,107,0.05)', border: '1px solid rgba(255,140,107,0.1)' }}>
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
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> 破冰靈感
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {insight.starters.map((starter) => (
                        <button
                          key={starter}
                          type="button"
                          className="pill text-[11px] border-0 cursor-pointer"
                          onClick={() => applyStarter(card.user.id, starter)}
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <button
                      className="flex-[0.8] flex items-center justify-center gap-1.5 text-sm font-semibold rounded-2xl transition-all active:scale-95 whitespace-nowrap min-w-[80px]"
                      style={{
                        padding: '14px 0',
                        background: 'rgba(255, 140, 107, 0.06)',
                        border: '1.5px solid rgba(255, 140, 107, 0.15)',
                        color: 'var(--text-secondary)',
                      }}
                      onClick={() => handleSkip(card.user.id)}
                    >
                      <X size={16} /> 跳過
                    </button>
                    <button
                      className="btn-primary flex-[2] flex items-center justify-center gap-1.5 text-sm !py-3.5 !rounded-2xl"
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
                  <div className="flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,140,107,0.08), rgba(255,107,107,0.08))', border: '1px solid rgba(255,140,107,0.12)' }}>
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
        )}
      </div>

      {/* Skip notice */}
      {skipNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up" role="status" aria-live="polite">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg" style={{ background: 'rgba(30,30,30,0.9)', backdropFilter: 'blur(12px)' }}>
            <span className="text-white text-sm">{skipNotice}</span>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
