'use client';

import React from 'react';
import { Users, Activity, Flame, Hash } from 'lucide-react';
import type { ServerDetail } from '@/lib/model/server';
import { Card } from '@/components/common/containers/Card';

export interface ServerOverviewMetricsProps {
  server: ServerDetail;
  channelCount: number;
}

export const ServerOverviewMetrics: React.FC<ServerOverviewMetricsProps> = ({
  server,
  channelCount,
}) => {
  const tiles = [
    {
      label: 'Online Members',
      value: server.onlineCount.toLocaleString(),
      icon: Activity,
    },
    {
      label: 'Total Members',
      value: server.totalCount.toLocaleString(),
      icon: Users,
    },
    {
      label: 'Nitro Boost Tier',
      value: `Level ${server.boostLevel} (${server.boostCount})`,
      icon: Flame,
    },
    {
      label: 'Synchronized Channels',
      value: channelCount.toLocaleString(),
      icon: Hash,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card key={tile.label} className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
              <Icon size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400">{tile.label}</span>
              <span className="text-base font-bold text-white font-mono">
                {tile.value}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
