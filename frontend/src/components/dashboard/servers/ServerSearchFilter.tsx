'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { TextInput } from '@/components/common/input/TextInput';

export interface ServerSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

export const ServerSearchFilter: React.FC<ServerSearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-apple-xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-xl">
      <div className="flex-1 max-w-md">
        <TextInput
          type="text"
          placeholder={`Search across ${totalCount} managed Discord guilds...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>
      <span className="text-xs font-mono text-zinc-400">
        Showing active JDA 5 Gateway synchronized servers
      </span>
    </div>
  );
};
