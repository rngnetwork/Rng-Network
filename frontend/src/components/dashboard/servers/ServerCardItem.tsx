'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Activity, ArrowRight, Bot, Flame } from 'lucide-react';
import type { ServerItem } from '@/lib/model/server';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';

export interface ServerCardItemProps {
  server: ServerItem;
  index?: number;
  onManage: (server: ServerItem) => void;
}

export const ServerCardItem: React.FC<ServerCardItemProps> = ({
  server,
  index = 0,
  onManage,
}) => {
  const [iconError, setIconError] = useState(false);
  const iconSrc = iconError || !server.iconUrl ? '/assets/staff.png' : server.iconUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative rounded-apple-xl p-6 transition-all duration-300 overflow-hidden border border-white/10 hover:border-brand-red/50 bg-zinc-900/80 backdrop-blur-xl shadow-apple-card flex flex-col justify-between h-full"
    >
      <div className="flex flex-col flex-1 justify-between">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-apple-lg overflow-hidden border border-brand-red/30 bg-black/60 shadow-crimson-glow shrink-0">
              <Image
                src={iconSrc}
                alt={server.name}
                fill
                unoptimized
                className="object-cover"
                onError={() => setIconError(true)}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-white truncate tracking-tight group-hover:text-red-300 transition-colors">
                {server.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="neutral">/{server.slug}</Badge>
                <span className="text-xs text-zinc-400 font-mono truncate flex items-center gap-1">
                  <Bot size={13} className="text-brand-red shrink-0" />
                  ID: <span className="text-zinc-300">{server.id}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="crimson">Bot Active</Badge>
            {server.boostLevel > 0 && (
              <Badge variant="warning">
                <Flame size={11} className="mr-1 inline" />
                Tier {server.boostLevel} ({server.boostCount})
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
          <div className="p-3.5 rounded-apple-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-apple-md bg-brand-red/10 text-brand-red border border-brand-red/20">
              <Activity size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 font-medium">Online</span>
              <span className="text-base font-bold text-white font-mono">
                {server.onlineCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-apple-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-apple-md bg-brand-red/10 text-brand-red border border-brand-red/20">
              <Users size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 font-medium">Total Members</span>
              <span className="text-base font-bold text-white font-mono">
                {server.totalCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={() => onManage(server)}
        rightIcon={<ArrowRight size={16} />}
        className="w-full"
      >
        Manage Server
      </Button>
    </motion.div>
  );
};
