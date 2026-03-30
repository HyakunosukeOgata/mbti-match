'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { authReady, currentUser } = useApp();

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      router.replace('/');
      return;
    }
    router.replace(currentUser.onboardingComplete ? '/home' : '/onboarding/ai-chat');
  }, [authReady, currentUser, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center" style={{ background: '#FFF9F5' }}>
      <Loader2 size={32} className="animate-spin text-primary mb-4" />
      <p className="text-text-secondary text-sm">登入中...</p>
    </div>
  );
}
