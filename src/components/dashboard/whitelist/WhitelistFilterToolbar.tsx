'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { TextInput } from '@/components/common/input/TextInput';
import type { PersonnelHierarchyMap } from '@/lib/model/whitelist';

export interface WhitelistFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDesignationFilter: string;
  onDesignationChange: (designation: string) => void;
  hierarchy: PersonnelHierarchyMap;
  totalCount: number;
}

export const WhitelistFilterToolbar: React.FC<WhitelistFilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedDesignationFilter,
  onDesignationChange,
  hierarchy,
  totalCount,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-apple-xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-xl">
      <div className="flex-1 max-w-md">
        <TextInput
          type="text"
          placeholder="Search by email, name, role, designation..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search size={16} />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-2xl">
        <button
          type="button"
          onClick={() => onDesignationChange('ALL')}
          className={`text-xs px-3 py-1.5 rounded-apple-sm font-medium transition-all min-h-[36px] ${
            selectedDesignationFilter === 'ALL'
              ? 'bg-brand-red/20 text-red-300 border border-brand-red/40'
              : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5'
          }`}
        >
          All ({totalCount})
        </button>
        {Object.keys(hierarchy).map((des) => (
          <button
            key={des}
            type="button"
            onClick={() => onDesignationChange(des)}
            className={`text-xs px-3 py-1.5 rounded-apple-sm font-medium whitespace-nowrap transition-all min-h-[36px] ${
              selectedDesignationFilter === des
                ? 'bg-brand-red/20 text-red-300 border border-brand-red/40'
                : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {des}
          </button>
        ))}
      </div>
    </div>
  );
};
