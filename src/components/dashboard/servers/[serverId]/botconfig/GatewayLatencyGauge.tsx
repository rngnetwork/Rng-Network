'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import type { GatewayHealthData } from '@/lib/model/server';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';
import { ProgressBar } from '@/components/common/feedback/ProgressBar';

export interface GatewayLatencyGaugeProps {
  health: GatewayHealthData;
}

export const GatewayLatencyGauge: React.FC<GatewayLatencyGaugeProps> = ({
  health,
}) => {
  const healthQuality = Math.max(0, Math.min(100, 100 - Math.round(health.pingMs / 3)));

  return (
    <Card
      title="JDA 5 WebSocket Gateway Telemetry"
      subtitle="Real-time shard heartbeat and Redis cache synchronization"
      headerAction={
        <Badge variant={health.status === 'CONNECTED' ? 'success' : 'warning'}>
          <Radio size={12} className="mr-1 inline" />
          {health.status}
        </Badge>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] text-zinc-400 block">Gateway Ping</span>
            <span className="text-base font-bold text-white font-mono">
              {health.pingMs}ms
            </span>
          </div>
          <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] text-zinc-400 block">Active Shard</span>
            <span className="text-base font-bold text-white font-mono">
              #{health.shardId} / {health.totalShards}
            </span>
          </div>
          <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] text-zinc-400 block">Cached Guilds</span>
            <span className="text-base font-bold text-white font-mono">
              {health.cachedGuilds}
            </span>
          </div>
          <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[11px] text-zinc-400 block">SLA Window</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              &lt;50ms Ack
            </span>
          </div>
        </div>

        <ProgressBar
          label="Connection Stability Index"
          value={healthQuality}
          variant="success"
        />
      </div>
    </Card>
  );
};
