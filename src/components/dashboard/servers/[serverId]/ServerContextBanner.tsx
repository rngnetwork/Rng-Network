'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Flame, Hash, Bot } from 'lucide-react';
import type { ServerDetail } from '@/lib/model/server';
import { Badge } from '@/components/common/feedback/Badge';
import { Avatar } from '@/components/common/feedback/Avatar';
import { Tooltip } from '@/components/common/feedback/Tooltip';

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
          <Avatar
            src={avatarSrc}
            alt={server.name}
            fallback={server.shortName || server.name}
            size="xl"
            className="shrink-0"
          />

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
              <Tooltip content="Live JDA Gateway Daemon Connected">
                <Badge variant="success">
                  <Bot size={12} className="mr-1 inline" />
                  Bot Active
                </Badge>
              </Tooltip>

              <span className="text-zinc-600 hidden sm:inline">|</span>

              <Tooltip content="Discord Server Snowflake Identifier">
                <div className="text-zinc-400 font-mono text-xs hidden sm:flex items-center gap-1 cursor-default">
                  <Hash size={12} className="text-brand-red" />
                  <span>ID: {server.id}</span>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
