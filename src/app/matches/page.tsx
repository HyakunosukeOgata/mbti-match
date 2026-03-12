'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { mockUsers } from '@/lib/mock-data';
import BottomNav from '@/components/BottomNav';
import { MessageCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MatchesPage() {
  const { currentUser, matches } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const activeMatches = matches.filter(m => m.status === 'active');

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold">配對</h1>
        <p className="text-sm text-text-secondary">
          {activeMatches.length} 個配對
        </p>
      </div>

      <div className="px-6 space-y-3">
        {activeMatches.length === 0 && (
          <div className="text-center py-20">
            <MessageCircle size={48} className="mx-auto mb-4 text-text-secondary" />
            <p className="text-text-secondary">還沒有配對成功</p>
            <p className="text-xs text-text-secondary mt-1">
              去今日推薦送出喜歡吧！
            </p>
          </div>
        )}

        {activeMatches.map((match) => {
          const otherId = match.users.find(id => id !== currentUser.id);
          const otherUser = mockUsers.find(u => u.id === otherId);
          if (!otherUser) return null;

          const lastMsg = match.messages[match.messages.length - 1];
          const unread = lastMsg?.senderId !== currentUser.id && lastMsg?.senderId !== 'system';

          return (
            <Link
              key={match.id}
              href={`/chat/${match.id}`}
              className="card flex items-center gap-4 !p-4 no-underline text-text block"
            >
              {/* 頭像 */}
              <div className="relative">
                <img
                  src={otherUser.photos[0]}
                  alt={otherUser.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {unread && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-bg" />
                )}
              </div>

              {/* 內容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold">{otherUser.name}</span>
                  <span className="mbti-badge !text-xs !py-0.5 !px-2">{otherUser.mbtiCode}</span>
                </div>
                <p className="text-sm text-text-secondary truncate">
                  {lastMsg?.senderId === 'system'
                    ? '🎉 配對成功！開始聊天吧'
                    : lastMsg?.senderId === currentUser.id
                    ? `你: ${lastMsg.text}`
                    : lastMsg?.text || '開始聊天'}
                </p>
              </div>

              {/* 時間 */}
              <div className="text-xs text-text-secondary flex items-center gap-1">
                <Clock size={12} />
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
