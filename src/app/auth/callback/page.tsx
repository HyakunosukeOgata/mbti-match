'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authReady, currentUser } = useApp();
  const [exchangeDone, setExchangeDone] = useState(false);
  const [authError, setAuthError] = useState('');

  // Step 1: Exchange the PKCE code for a session
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setAuthError(error.message);
        }
        setExchangeDone(true);
      });
    } else {
      // No code param — might be hash-based (implicit) or already exchanged
      setExchangeDone(true);
    }
  }, [searchParams]);

  // Step 2: After exchange + auth ready, redirect
  useEffect(() => {
    if (!exchangeDone || !authReady) return;
    if (authError || !currentUser) {
      router.replace('/');
      return;
    }
    router.replace(currentUser.onboardingComplete ? '/home' : currentUser.aiPersonality ? '/personality' : '/onboarding/ai-chat');
  }, [exchangeDone, authReady, authError, currentUser, router]);

  return (
    <>
      <p className="text-text-secondary text-sm">
        {authError ? `登入失敗：${authError}` : '登入中...'}
      </p>
      {authError && (
        <button
          className="mt-4 text-sm text-primary underline"
          onClick={() => router.replace('/')}
        >
          返回登入頁
        </button>
      )}
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center" style={{ background: '#FFF9F5' }}>
      <Loader2 size={32} className="animate-spin text-primary mb-4" />
      <Suspense fallback={<p className="text-text-secondary text-sm">登入中...</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
