'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Calendar, Settings } from 'lucide-react';

const navItems = [
  { href: '/home', icon: Home, label: '今日' },
  { href: '/matches', icon: MessageCircle, label: '配對' },
  { href: '/weekly', icon: Calendar, label: '週題' },
  { href: '/settings', icon: Settings, label: '設定' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'active' : ''}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
