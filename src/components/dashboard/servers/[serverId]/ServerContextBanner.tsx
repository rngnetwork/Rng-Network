'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Flame, Hash, Bot } from 'lucide-react';
import type { ServerDetail } from '@/lib/model/server';
import { Badge } from '@/components/common/feedback/Badge';

export interface ServerContextBannerProps {
  server: ServerDetail;
}

export const ServerContextBanner: React.FC<ServerContextBannerProps> = ({ server }) => {
  const [iconError, setIconError] = useState(false);
  const avatarSrc = !iconError ? server.iconUrl || server.icon : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-apple-xl bg-zinc-900/80 border border-brand-red/20 p-6 md:p-8 backdrop-blur-xl shadow-apple-card"
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 md:gap-7 min-w-0">
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-apple-xl overflow-hidden border-2 border-brand-red/40 bg-black/60 shadow-crimson-glow shrink-0 flex items-center justify-center">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={server.name}
                fill
                unoptimized
                className="object-cover"
                onError={() => setIconError(true)}
              />
            ) : (
              <span className="text-xl md:text-2xl font-bold text-white font-mono tracking-wider">
                {server.shortName ||
                  server.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 3)
                    .toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
                {server.name}
              </h1>
              <Badge variant="crimson">
                <Flame size={12} className="mr-1 inline" />
                {server.boostLevel > 0
                  ? `Level ${server.boostLevel} (${server.boostCount} Boosts)`
                  : 'Standard Tier'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs md:text-sm">
              <div className="flex items-center gap-2 font-mono font-semibold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                <span>{server.onlineCount.toLocaleString()} Online</span>
              </div>

              <span className="text-zinc-600">|</span>

              <div className="text-zinc-300 font-mono font-medium">
                Total Members:{' '}
                <span className="text-white font-bold">
                  {server.totalCount.toLocaleString()}
                </span>
              </div>

              <span className="text-zinc-600 hidden sm:inline">|</span>

              <Badge variant="success">
                <Bot size={12} className="mr-1 inline" />
                Bot Active
              </Badge>

              <span className="text-zinc-600 hidden sm:inline">|</span>

              <div className="text-zinc-400 font-mono text-xs hidden sm:flex items-center gap-1">
                <Hash size={12} className="text-brand-red" />
                <span>ID: {server.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
