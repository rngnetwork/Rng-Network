'use client';

import React from 'react';
import { Hash, Volume2 } from 'lucide-react';
import type { ChannelItem } from '@/lib/model/channel';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface ChannelOverviewListProps {
  channels: ChannelItem[];
}

export const ChannelOverviewList: React.FC<ChannelOverviewListProps> = ({ channels }) => {
  const sorted = [...channels].sort((a, b) => a.position - b.position);

  return (
    <Card
      title="Guild Channel Directory"
      subtitle="Synchronized via JDA 5 Gateway & Redis read-through cache"
    >
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          No channels synchronized for this guild.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {sorted.map((channel) => {
            const isVoice = channel.type === 2;
            return (
              <div
                key={channel.id}
                className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isVoice ? (
                    <Volume2 size={15} className="text-amber-400 shrink-0" />
                  ) : (
                    <Hash size={15} className="text-brand-red shrink-0" />
                  )}
                  <span className="text-xs font-medium text-white truncate">
                    {channel.name}
                  </span>
                </div>
                <Badge variant={isVoice ? 'warning' : 'neutral'}>
                  {isVoice ? 'Voice' : 'Text'}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
