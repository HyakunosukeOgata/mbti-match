'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-text-secondary hover:text-text mb-6 transition-colors min-h-[44px]"
    >
      <ArrowLeft size={20} />
      <span className="text-sm">返回</span>
    </button>
  );
}
