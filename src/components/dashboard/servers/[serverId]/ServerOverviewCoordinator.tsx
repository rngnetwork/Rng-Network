'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const ServerOverviewCoordinator: React.FC = () => {
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
      <div className="w-8 h-8 border-2 border-white/10 border-t-brand-red rounded-full animate-spin shadow-crimson-glow" />
    </div>
  );
};
