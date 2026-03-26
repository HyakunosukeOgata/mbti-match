'use client';

import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Settings, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/home', icon: Home, label: '探索' },
  { href: '/matches', icon: MessageCircle, label: '配對' },
  { href: '/notifications', icon: Bell, label: '通知' },
  { href: '/settings', icon: Settings, label: '我的' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { currentUser, authReady, matches } = useApp();
  const [notifCount, setNotifCount] = useState(0);

  // Unread message count across all matches
  const unreadMsgCount = matches.reduce((sum, m) => {
    const unread = m.messages.filter(msg => msg.senderId !== currentUser?.id && !msg.readAt).length;
    return sum + unread;
  }, 0);

  useEffect(() => {
    if (!authReady || !currentUser?.dbId) {
      setNotifCount(0);
      return;
    }

    const loadUnread = async () => {
      // Only count non-message notifications for the bell icon
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.dbId)
        .eq('read', false)
        .neq('type', 'message');
      setNotifCount(count || 0);
    };

    void loadUnread();

    const channel = supabase
      .channel(`notifications-badge-${currentUser.dbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.dbId}` }, () => { void loadUnread(); })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authReady, currentUser?.dbId]);

  return (
    <nav className="bottom-nav" aria-label="主導航列">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const badgeCount = item.href === '/notifications' ? notifCount : item.href === '/matches' ? unreadMsgCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="relative">
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
