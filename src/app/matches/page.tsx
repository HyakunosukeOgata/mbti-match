'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import { MessageCircle, Clock, Heart } from 'lucide-react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

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
        <h1 className="text-2xl font-extrabold">
          <span className="gradient-text">配對</span> 💬
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {activeMatches.length} 個進行中的對話
        </p>
      </div>

      <div className="px-6 space-y-3">
        {activeMatches.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(124, 58, 237, 0.08)' }}>
              <Heart size={36} className="text-primary-light" />
            </div>
            <p className="text-text font-semibold text-lg mb-1">還沒有配對</p>
            <p className="text-sm text-text-secondary mb-4">
              去探索頁送出喜歡，開啟你的故事 💜
            </p>
            <button className="btn-primary !w-auto !px-8" onClick={() => router.push('/home')}>
              ✨ 去探索
            </button>
          </div>
        )}

        {activeMatches.map((match, idx) => {
          const otherId = match.users.find(id => id !== currentUser.id);
          const otherUser = mockUsers.find(u => u.id === otherId);
          if (!otherUser) return null;

          const lastMsg = match.messages[match.messages.length - 1];
          const unread = lastMsg?.senderId !== currentUser.id && lastMsg?.senderId !== 'system';

          return (
            <Link
              key={match.id}
              href={`/chat/${match.id}`}
              className="card flex items-center gap-4 !p-4 no-underline text-text block animate-slide-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ boxShadow: '0 3px 10px rgba(124, 58, 237, 0.12)' }}>
                  <img
                    src={otherUser.photos[0]}
                    alt={otherUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {unread && (
                  <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full border-2 border-white flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #F43F5E)' }}>
                    <span className="text-[9px] font-bold text-white">NEW</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{otherUser.name}</span>
                  <span className="mbti-badge !text-[10px] !py-0.5 !px-2">{otherUser.mbtiCode}</span>
                </div>
                <p className="text-sm text-text-secondary truncate">
                  {lastMsg?.senderId === 'system'
                    ? '🎉 配對成功！開始聊天吧'
                    : lastMsg?.senderId === currentUser.id
                    ? `你: ${lastMsg.text}`
                    : lastMsg?.text || '開始聊天'}
                </p>
              </div>

              <div className="text-xs text-text-secondary flex items-center gap-1 opacity-60">
                <Clock size={11} />
                {lastMsg
                  ? new Date(lastMsg.timestamp).toLocaleTimeString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </div>
            </Link>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
