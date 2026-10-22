'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

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
      <RngLoadingSpinner size="md" label="Routing Server Settings..." />
    </div>
  );
};
