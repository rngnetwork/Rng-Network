"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { BotConfigManager } from '@/components/botconfig/BotConfigManager';

export default function BotConfigPage() {
  const params = useParams();
  const serverId = (params?.serverId as string) || '1';

  return (
    <div className="w-full pb-20">
      <BotConfigManager serverId={serverId} />
    </div>
  );
}
