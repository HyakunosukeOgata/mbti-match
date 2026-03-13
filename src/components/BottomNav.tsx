'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/home', icon: Home, label: '探索' },
  { href: '/matches', icon: MessageCircle, label: '配對' },
  { href: '/weekly', icon: Sparkles, label: '週題' },
  { href: '/settings', icon: Settings, label: '我的' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="主導航列">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
