'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ShieldOff, Loader2 } from 'lucide-react';

interface BlockedUser {
  blockId: string;
  userId: string;
  name: string;
  blockedAt: string;
}

export default function BlockedUsersPage() {
  const { authReady, currentUser, session } = useApp();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState('');
  const [toast, setToast] = useState('');

  const fetchBlocked = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/social/unblock', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocked || []);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) { router.replace('/'); return; }
    fetchBlocked();
  }, [authReady, currentUser, router, fetchBlocked]);

  const handleUnblock = async (userId: string, name: string) => {
    if (!session?.access_token || unblocking) return;
    setUnblocking(userId);
    try {
      const res = await fetch('/api/social/unblock', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blockedUserId: userId }),
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.userId !== userId));
        setToast(`已解除封鎖 ${name}`);
        setTimeout(() => setToast(''), 2500);
      } else {
        setToast('解除封鎖失敗');
        setTimeout(() => setToast(''), 2500);
      }
    } catch {
      setToast('網路錯誤，請稍後再試');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setUnblocking('');
    }
  };

  if (!authReady || !currentUser) return null;

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold">封鎖名單</h1>
        </div>
      </div>

      <div className="px-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-text-secondary" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-16">
            <ShieldOff size={40} className="mx-auto text-text-secondary/30 mb-3" />
            <p className="text-text-secondary text-sm">沒有封鎖的用戶</p>
          </div>
        ) : (
          blockedUsers.map(user => (
            <div key={user.userId} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {new Date(user.blockedAt).toLocaleDateString('zh-TW')} 封鎖
                </p>
              </div>
              <button
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-border hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                onClick={() => handleUnblock(user.userId, user.name)}
                disabled={unblocking === user.userId}
              >
                {unblocking === user.userId ? '解除中...' : '解除封鎖'}
              </button>
            </div>
          ))
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium" style={{ background: 'rgba(30,30,30,0.9)' }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
