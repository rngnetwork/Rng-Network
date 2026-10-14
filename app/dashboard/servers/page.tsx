"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/embeds');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
    </div>
  );
}
