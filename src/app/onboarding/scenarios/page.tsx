'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ScenariosRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/onboarding/ai-chat'); }, [router]);
  return null;
}
