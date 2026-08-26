"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ServerIndexPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params?.serverId as string;

  useEffect(() => {
    if (serverId) {
      router.replace(`/dashboard/servers/${serverId}/settings`);
    }
  }, [router, serverId]);

  return (
    <div className="flex items-center justify-center min-h-[30vh]">
      <div className="w-8 h-8 border-3 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
    </div>
  );
}
