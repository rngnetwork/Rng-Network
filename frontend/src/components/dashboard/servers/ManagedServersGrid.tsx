'use client';

import React from 'react';
import type { ServerItem } from '@/lib/model/server';
import { ServerCardItem } from './ServerCardItem';

export interface ManagedServersGridProps {
  servers: ServerItem[];
  onManageServer: (server: ServerItem) => void;
}

export const ManagedServersGrid: React.FC<ManagedServersGridProps> = ({
  servers,
  onManageServer,
}) => {
  if (servers.length === 0) {
    return (
      <div className="p-10 rounded-apple-xl bg-zinc-900/70 border border-white/10 text-center">
        <p className="text-sm text-zinc-400">
          No Discord guilds match the current search filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      {servers.map((server, idx) => (
        <ServerCardItem
          key={server.id}
          server={server}
          index={idx}
          onManage={onManageServer}
        />
      ))}
    </div>
  );
};
