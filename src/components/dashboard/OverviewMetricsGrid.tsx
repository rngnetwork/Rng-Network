'use client';

import React from 'react';
import { Server, ShieldCheck, Boxes, Send } from 'lucide-react';
import type { DashboardStats } from '@/lib/model/analytics';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface OverviewMetricsGridProps {
  stats: DashboardStats;
}

export const OverviewMetricsGrid: React.FC<OverviewMetricsGridProps> = ({ stats }) => {
  const metricCards = [
    {
      label: 'Managed Guilds',
      value: stats.totalManagedServers.toLocaleString(),
      icon: Server,
      badge: stats.gatewayStatus,
      badgeVariant: stats.gatewayStatus === 'CONNECTED' ? ('success' as const) : ('warning' as const),
    },
    {
      label: 'Whitelisted Personnel',
      value: stats.totalWhitelistedPersonnel.toLocaleString(),
      icon: ShieldCheck,
      badge: 'Verified',
      badgeVariant: 'crimson' as const,
    },
    {
      label: 'Components V2 Templates',
      value: stats.totalTemplatesSaved.toLocaleString(),
      icon: Boxes,
      badge: 'MongoDB 7',
      badgeVariant: 'neutral' as const,
    },
    {
      label: 'Total Dispatches',
      value: stats.totalDispatches24h.toLocaleString(),
      icon: Send,
      badge: `${stats.averageLatencyMs}ms avg`,
      badgeVariant: 'info' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
                <Icon size={20} />
              </div>
              <Badge variant={item.badgeVariant}>{item.badge}</Badge>
            </div>
            <div>
              <span className="text-2xl font-bold text-white font-mono tracking-tight">
                {item.value}
              </span>
              <p className="text-xs text-zinc-400 mt-1">{item.label}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
