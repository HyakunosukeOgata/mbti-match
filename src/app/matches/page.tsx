'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import PhotoGallery from '@/components/PhotoGallery';
import { MessageCircle, Clock, Heart, Sparkles, Flame } from 'lucide-react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { calculateCompatibility } from '@/lib/matching';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '剛剛';
  if (diffMin < 60) return `${diffMin}分鐘前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小時前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

export default function MatchesPage() {
  const { currentUser, matches } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    } else {
      track('page_view', { page: 'matches' });
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const activeMatches = matches.filter(m => m.status === 'active');

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">配對</span>
          </h1>
          {activeMatches.length > 0 && (
            <span className="text-xs font-semibold text-text-secondary bg-bg-input px-3 py-1 rounded-full">
              {activeMatches.length} 個對話
            </span>
          )}
        </div>
      </div>

      <div className="px-6 space-y-3">
        {activeMatches.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: 'rgba(232, 132, 44, 0.06)' }} />
              <div className="w-28 h-28 rounded-full flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, rgba(232, 132, 44, 0.1), rgba(255, 107, 107, 0.08))' }}>
                <MessageCircle size={44} className="text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-text font-bold text-xl mb-2">還沒有對話</p>
            <p className="text-sm text-text-secondary mb-6 max-w-[240px] mx-auto leading-relaxed">
              探索與你最有默契的人，<br />開啟專屬你們的故事
            </p>
            <button className="btn-primary !w-auto !px-10 animate-pulse-ring" onClick={() => router.push('/home')}>
              <Sparkles size={16} className="inline mr-1.5 -mt-0.5" />
              開始探索
            </button>
          </div>
        )}

        {activeMatches.map((match, idx) => {
          const otherId = match.users.find(id => id !== currentUser.id);
          const otherUser = mockUsers.find(u => u.id === otherId);
          if (!otherUser) return null;

          const lastMsg = match.messages[match.messages.length - 1];
          const hasUserMessages = match.messages.some(m => m.senderId === currentUser.id);
          const unread = !hasUserMessages
            ? lastMsg?.senderId === 'system' // new match, not yet chatted
            : lastMsg?.senderId !== currentUser.id && lastMsg?.senderId !== 'system';
          const compat = calculateCompatibility(currentUser, otherUser);

          return (
            <Link
              key={match.id}
              href={`/chat/${match.id}`}
              className={`match-card flex items-center gap-4 no-underline text-text block animate-slide-up${unread ? ' match-card-unread' : ''}`}
              style={{ animationDelay: `${idx * 0.08}s`, '--compat-opacity': Math.min(compat / 100, 0.6) } as React.CSSProperties}
            >
              <div className="relative">
                <PhotoGallery photos={otherUser.photos} name={otherUser.name} mode="thumbnail" size="w-14 h-14" />
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-400" />
                {unread && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full animate-pulse-ring" style={{ background: 'linear-gradient(135deg, #E8842C, #FF6B6B)' }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{otherUser.name}</span>
                  <span className="mbti-badge !text-[11px] !py-0.5 !px-2">{otherUser.mbtiCode}</span>
                </div>
                <p className={`text-sm truncate ${unread ? 'text-text font-medium' : 'text-text-secondary'}`}>
                  {lastMsg?.senderId === 'system'
                    ? '🎉 配對成功！開始聊天吧'
                    : lastMsg?.senderId === currentUser.id
                    ? `你: ${lastMsg.text}`
                    : lastMsg?.text || '開始聊天'}
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                <div className={`compat-pill ${compat >= 80 ? 'compat-pill-high' : compat >= 60 ? 'compat-pill-mid' : 'compat-pill-low'}`}>
                  {compat >= 80 && <Flame size={11} />}
                  {compat}%
                </div>
                <div className="text-[11px] text-text-secondary">
                  {lastMsg
                    ? formatRelativeTime(new Date(lastMsg.timestamp))
                    : ''}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
