'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import { Bell, Eye, Heart, Sparkles } from 'lucide-react';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { AppNotification } from '@/lib/types';
import { mapNotificationRow, type DbNotificationRow } from '@/lib/social';

const ICON_MAP: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  match: { icon: Heart, color: '#FF6B8A', bg: 'rgba(255,107,138,0.1)' },
  like: { icon: Heart, color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
  profile_view: { icon: Eye, color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  weekly: { icon: Sparkles, color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
  system: { icon: Bell, color: '#8C7B6E', bg: 'rgba(140,123,110,0.1)' },
};

type Tab = 'all' | 'likes' | 'views';

interface Liker {
  id: string;
  dbId: string;
  name: string;
  photo: string | null;
  age: number;
  hideAge: boolean;
  likedAt: string;
}

interface Viewer {
  id: string;
  dbId: string;
  name: string;
  photo: string | null;
  viewedAt: string;
}

export default function NotificationsPage() {
  const { currentUser, authReady, session } = useApp();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [likers, setLikers] = useState<Liker[]>([]);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);

  useEffect(() => {
    if (!authReady || !currentUser?.dbId) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.dbId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        setNotifications([]);
        return;
      }

      setNotifications((data as DbNotificationRow[]).map(mapNotificationRow));
    };

    void loadNotifications();

    const channel = supabase
      .channel(`notifications-page-${currentUser.dbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.dbId}` }, () => { void loadNotifications(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authReady, currentUser?.dbId]);

  // Load likers when tab switches
  useEffect(() => {
    if (tab !== 'likes' || !session?.access_token) return;
    setLoadingLikers(true);
    fetch('/api/social/who-liked-me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.json())
      .then(data => setLikers(data.likers || []))
      .catch(() => setLikers([]))
      .finally(() => setLoadingLikers(false));
  }, [tab, session?.access_token]);

  // Load viewers when tab switches
  useEffect(() => {
    if (tab !== 'views' || !session?.access_token) return;
    setLoadingViewers(true);
    fetch('/api/social/profile-views', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(res => res.json())
      .then(data => setViewers(data.viewers || []))
      .catch(() => setViewers([]))
      .finally(() => setLoadingViewers(false));
  }, [tab, session?.access_token]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
      return;
    }
    if (!currentUser.onboardingComplete) {
      router.replace('/onboarding/ai-chat');
      return;
    }
    track('page_view', { page: 'notifications' });
  }, [authReady, currentUser, router]);

  if (!authReady || !currentUser) return null;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', currentUser.dbId);
    setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.dbId).eq('read', false).neq('type', 'message');
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const handleClick = async (notif: AppNotification) => {
    await markAsRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  // Filter out message notifications — those are shown as badges on the matches tab
  const displayNotifications = notifications.filter(n => n.type !== 'message');
  const unreadCount = displayNotifications.filter(n => !n.read).length;

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))} 分鐘前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小時前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    return new Date(ts).toLocaleDateString('zh-TW');
  };

  const tabs: { key: Tab; label: string; icon: typeof Heart }[] = [
    { key: 'all', label: '全部', icon: Bell },
    { key: 'likes', label: '喜歡我', icon: Heart },
    { key: 'views', label: '看過我', icon: Eye },
  ];

  return (
    <div className="min-h-dvh pb-24">
      <div className="px-6 pt-8 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <span className="gradient-text">通知</span>
        </h1>
        {tab === 'all' && unreadCount > 0 && (
          <button
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            onClick={markAllRead}
          >
            全部已讀
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === t.key ? 'text-white' : 'text-text-secondary'}`}
              style={{
                background: tab === t.key ? 'linear-gradient(135deg, #FF8C6B, #FF6B8A)' : 'var(--bg-input)',
              }}
              onClick={() => setTab(t.key)}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {/* All notifications tab */}
        {tab === 'all' && (
          displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Bell size={48} className="mb-4 opacity-30" />
              <p className="text-sm">目前沒有通知</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(notif => {
                const iconConfig = ICON_MAP[notif.type] || ICON_MAP.system;
                const IconComp = iconConfig.icon;
                return (
                  <div
                    key={notif.id}
                    className={`relative card !p-3.5 cursor-pointer transition-all group ${!notif.read ? 'ring-1 ring-primary/20' : 'opacity-75'}`}
                    onClick={() => { void handleClick(notif); }}
                  >
                    {!notif.read && (
                      <div className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: iconConfig.bg }}
                      >
                        <IconComp size={18} color={iconConfig.color} />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{notif.body}</p>
                        <p className="text-[11px] text-text-secondary/60 mt-1.5">{formatTime(notif.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Who liked me tab */}
        {tab === 'likes' && (
          loadingLikers ? (
            <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : likers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Heart size={48} className="mb-4 opacity-30" />
              <p className="text-sm">還沒有人喜歡你</p>
              <p className="text-xs text-text-secondary/60 mt-1">持續完善你的個人資料吧！</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {likers.map(liker => (
                <div key={liker.dbId} className="card !p-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--bg-input)' }}>
                    {liker.photo ? (
                      <img src={liker.photo} alt={liker.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold gradient-bg text-white">{liker.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{liker.name}</span>
                      {!liker.hideAge && <span className="text-xs text-text-secondary">{liker.age}歲</span>}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{formatTime(liker.likedAt)}</p>
                  </div>
                  <Heart size={16} fill="#FF6B6B" color="#FF6B6B" />
                </div>
              ))}
            </div>
          )
        )}

        {/* Who viewed me tab */}
        {tab === 'views' && (
          loadingViewers ? (
            <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <Eye size={48} className="mb-4 opacity-30" />
              <p className="text-sm">還沒有人看過你的檔案</p>
              <p className="text-xs text-text-secondary/60 mt-1">上傳好看的照片可以增加曝光度！</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {viewers.map(viewer => (
                <div key={viewer.dbId} className="card !p-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--bg-input)' }}>
                    {viewer.photo ? (
                      <img src={viewer.photo} alt={viewer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold gradient-bg text-white">{viewer.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{viewer.name}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{formatTime(viewer.viewedAt)}</p>
                  </div>
                  <Eye size={16} className="text-text-secondary/40" />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}
