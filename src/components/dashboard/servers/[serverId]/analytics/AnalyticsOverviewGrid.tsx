'use client';

import React from 'react';
import { Send, MousePointerClick, CheckCircle2, Gauge } from 'lucide-react';
import type { ServerAnalyticsData } from '@/lib/model/analytics';
import { Card } from '@/components/common/containers/Card';

export interface AnalyticsOverviewGridProps {
  analytics: ServerAnalyticsData;
}

export const AnalyticsOverviewGrid: React.FC<AnalyticsOverviewGridProps> = ({
  analytics,
}) => {
  const tiles = [
    {
      label: 'Total Dispatches',
      value: analytics.totalDispatches.toLocaleString(),
      icon: Send,
    },
    {
      label: 'Component Interactions',
      value: analytics.totalInteractions.toLocaleString(),
      icon: MousePointerClick,
    },
    {
      label: 'Delivery Success Rate',
      value: `${analytics.successRatePercent}%`,
      icon: CheckCircle2,
    },
    {
      label: 'Average REST Latency',
      value: `${analytics.averageLatencyMs}ms`,
      icon: Gauge,
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
              <span className="text-lg font-bold text-white font-mono">
                {tile.value}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
