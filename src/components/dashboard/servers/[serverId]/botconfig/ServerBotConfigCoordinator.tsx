'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchBotConfig,
  fetchGatewayHealth,
  updateBotPrefix,
} from '@/lib/api/dashboard/servers/[serverId]/botconfig';
import type { BotConfigData, GatewayHealthData } from '@/lib/model/server';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { BotRuntimeControls } from './BotRuntimeControls';

const DEFAULT_CONFIG: BotConfigData = {
  serverId: '',
  commandPrefix: '!',
  ephemeralRepliesDefault: true,
  auditLogChannelId: null,
  ticketCategoryChannelId: null,
  rateLimitPerMember: 3,
};

const DEFAULT_HEALTH: GatewayHealthData = {
  status: 'CONNECTED',
  pingMs: 24,
  shardId: 0,
  totalShards: 1,
  cachedGuilds: 1,
  uptimeSeconds: 86400,
};

export const ServerBotConfigCoordinator: React.FC = () => {
  const params = useParams();
  const serverId = (params?.serverId as string) || '';
  const { toast } = useToast();

  const [config, setConfig] = useState<BotConfigData>(DEFAULT_CONFIG);
  const [health, setHealth] = useState<GatewayHealthData>(DEFAULT_HEALTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadBotData = async () => {
      const token = localStorage.getItem('accessToken') ?? undefined;
      if (!serverId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [cfgRes, healthRes] = await Promise.allSettled([
          fetchBotConfig(serverId, token),
          fetchGatewayHealth(serverId, token),
        ]);

        if (isMounted) {
          if (cfgRes.status === 'fulfilled' && cfgRes.value.success && cfgRes.value.data) {
            setConfig(cfgRes.value.data);
          }
          if (healthRes.status === 'fulfilled' && healthRes.value.success && healthRes.value.data) {
            setHealth(healthRes.value.data);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadBotData();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const handleSavePrefix = async (prefix: string) => {
    const token = localStorage.getItem('accessToken') ?? undefined;
    const res = await updateBotPrefix(serverId, prefix, token);
    if (res.success && res.data) {
      setConfig(res.data);
      toast({
        type: 'success',
        title: 'Bot Configuration Saved',
        description: `Command prefix updated to "${res.data.commandPrefix}".`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RngLoadingSpinner size="lg" label="Loading Bot Module State..." />
      </div>
    );
  }

  return (
    <BotRuntimeControls
      config={config}
      health={health}
      onSavePrefix={handleSavePrefix}
    />
  );
};
