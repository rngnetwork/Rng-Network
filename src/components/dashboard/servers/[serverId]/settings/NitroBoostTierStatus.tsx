'use client';

import React from 'react';
import { Flame, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface NitroBoostTierStatusProps {
  boostLevel: number;
  boostCount: number;
}

export const NitroBoostTierStatus: React.FC<NitroBoostTierStatusProps> = ({
  boostLevel,
  boostCount,
}) => {
  const tiers = [
    {
      level: 0,
      title: 'Tier 0 · Base Guild',
      perk: 'Standard static PNG/JPEG/WebP server icon',
      unlocked: true,
    },
    {
      level: 1,
      title: 'Tier 1 · 2+ Boosts',
      perk: 'Animated GIF server icon unlocked',
      unlocked: boostLevel >= 1,
    },
    {
      level: 2,
      title: 'Tier 2 · 7+ Boosts',
      perk: 'Static server banner upload unlocked',
      unlocked: boostLevel >= 2,
    },
    {
      level: 3,
      title: 'Tier 3 · 14+ Boosts',
      perk: 'Animated GIF server banner upload unlocked',
      unlocked: boostLevel >= 3,
    },
  ];

  return (
    <Card
      title="Discord Nitro Boost Perk Gating"
      subtitle="Active server customization capabilities based on guild boost tier"
      headerAction={
        <Badge variant="crimson">
          <Flame size={12} className="mr-1 inline" />
          Level {boostLevel} ({boostCount} Boosts)
        </Badge>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((t) => (
          <div
            key={t.level}
            className={`p-3.5 rounded-apple-md border flex flex-col justify-between gap-2 ${
              t.unlocked
                ? 'bg-brand-red/5 border-brand-red/25'
                : 'bg-white/[0.01] border-white/[0.06] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">{t.title}</span>
              {t.unlocked ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <Lock size={14} className="text-zinc-500" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400">{t.perk}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
