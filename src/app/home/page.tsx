'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { calculateCompatibility, getSharedAnswers } from '@/lib/matching';
import { mockUsers } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import { Heart, Clock, MessageCircle, Sparkles, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function HomePage() {
  const { currentUser, dailyCards, refreshDailyCards, likeUser } = useApp();
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [topicAnswers, setTopicAnswers] = useState<Record<string, string>>({});
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (!currentUser.onboardingComplete) {
      router.replace('/onboarding/mbti');
      return;
    }
    if (dailyCards.length === 0) {
      refreshDailyCards();
    }
  }, [currentUser]);

  // 倒數計時
  useEffect(() => {
    if (dailyCards.length === 0) return;
    const timer = setInterval(() => {
      const expires = new Date(dailyCards[0]?.expiresAt);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('已過期');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${mins}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [dailyCards]);

  if (!currentUser) return null;

  const handleLike = (userId: string) => {
    const answer = topicAnswers[userId];
    if (!answer?.trim()) return;
    const matched = likeUser(userId, answer);
    if (matched) {
      setShowMatchAlert(true);
      setTimeout(() => setShowMatchAlert(false), 3000);
    }
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
            <h1 className="text-xl font-bold">今日推薦</h1>
            <p className="text-sm text-text-secondary">
              {dailyCards.filter(c => !c.liked).length} 張卡片等你探索
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-warning">
            <Clock size={14} />
            <span>{countdown}</span>
          </div>
        </div>
      </div>

      {/* 配對成功提示 */}
      {showMatchAlert && (
        <div className="mx-6 mb-4 p-3 rounded-xl animate-slide-up bg-bg-input border border-success/30">
          <p className="text-center text-sm font-medium text-success">配對成功！快去聊天頁面看看</p>
        </div>
      )}

      {/* 卡片列表 */}
      <div className="px-6 space-y-4">
        {dailyCards.length === 0 && (
          <div className="text-center py-20">
            <Sparkles size={48} className="mx-auto mb-4 text-primary-light" />
            <p className="text-text-secondary">正在為你配對...</p>
            <button className="btn-primary mt-4" onClick={refreshDailyCards}>
              產生今日卡片
            </button>
          </div>
        )}

        {dailyCards.map((card, idx) => {
          const isExpanded = expandedCard === card.user.id;
          const compat = calculateCompatibility(currentUser, card.user);

          return (
            <div
              key={card.user.id}
              className="card animate-slide-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              {/* 基本信息 */}
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedCard(isExpanded ? null : card.user.id)}
              >
                {/* 頭像 */}
                <div className="relative">
                  <img
                    src={card.user.photos[0]}
                    alt={card.user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className={`compat-ring absolute -bottom-1 -right-1 w-8 h-8 text-xs ${getCompatClass(compat)}`}>
                    {compat}
                  </div>
                </div>

                {/* 資訊 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{card.user.name}</span>
                    <span className="text-text-secondary text-sm">{card.user.age}歲</span>
                  </div>
                  <span className="mbti-badge text-xs">{card.user.mbtiCode}</span>
                </div>

                {/* 展開/收合 */}
                <div className="text-text-secondary">
                  {card.liked ? (
                    <Heart size={22} fill="var(--accent)" color="var(--accent)" />
                  ) : isExpanded ? (
                    <ChevronUp size={22} />
                  ) : (
                    <ChevronDown size={22} />
                  )}
                </div>
              </div>

              {/* 展開內容 */}
              {isExpanded && !card.liked && (
                <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                  {/* 自我介紹 */}
                  <div className="mb-4">
                    <p className="text-sm text-text-secondary mb-1">自我介紹</p>
                    <p className="text-sm leading-relaxed">{card.user.bio}</p>
                  </div>

                  {/* 配對度分析 */}
                  <div className="mb-4 p-3 rounded-lg bg-bg-input">
                    <p className="text-sm font-medium mb-2">
                      配對度 {compat}%
                    </p>
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
                      <MessageCircle size={14} className="text-text-secondary" />
                      <p className="text-sm font-medium">今日話題</p>
                    </div>
                    <div className="p-3 rounded-lg bg-bg-input">
                      <p className="text-sm">{card.topic.text}</p>
                    </div>
                  </div>

                  {/* 回答話題 + 送出喜歡 */}
                  <div className="space-y-3">
                    <textarea
                      value={topicAnswers[card.user.id] || ''}
                      onChange={(e) =>
                        setTopicAnswers(prev => ({ ...prev, [card.user.id]: e.target.value }))
                      }
                      placeholder="寫下你的回答，一起送出喜歡"
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
                  </div>
                </div>
              )}

              {/* 已喜歡狀態 */}
              {card.liked && (
                <div className="mt-3 pt-3 border-t border-border text-center">
                  <p className="text-sm text-text-secondary">已送出喜歡，等待對方回應</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
