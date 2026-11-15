'use client';

import React from 'react';
import { Search, Plus, Layers, Hash } from 'lucide-react';
import { Button, Badge } from '@/components/common';

export interface RoleMatrixToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalRolesCount: number;
  totalDesignationsCount: number;
  onOpenAddDesignation: () => void;
  onOpenAddRank: () => void;
}

export const RoleMatrixToolbar: React.FC<RoleMatrixToolbarProps> = ({
  searchQuery,
  onSearchChange,
  totalRolesCount,
  totalDesignationsCount,
  onOpenAddDesignation,
  onOpenAddRank,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-apple-lg bg-surface-canvas/80 border border-white/[0.08] backdrop-blur-md">
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search roles across hierarchy..."
            className="w-full pl-9 pr-3 py-1.5 rounded-apple-md bg-[#0E0E12] border border-surface-border text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/30 transition-all"
          />
        </div>
        <Badge variant="neutral" size="md" className="font-mono text-xs whitespace-nowrap bg-white/[0.04] text-zinc-300 border border-white/10">
          {totalRolesCount} Roles
        </Badge>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onOpenAddDesignation}
          leftIcon={<Layers size={13} />}
          className="text-xs"
        >
          Add Designation
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onOpenAddRank}
          leftIcon={<Plus size={13} />}
          className="text-xs"
        >
          Add Rank Row
        </Button>
      </div>
    </div>
  );
};
