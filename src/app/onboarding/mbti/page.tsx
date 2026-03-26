'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy MBTI page — redirects to AI chat onboarding.
 * Kept as a redirect so old bookmarks / deep links still work.
 */
export default function MBTIPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/ai-chat');
  }, [router]);

  return null;
}
