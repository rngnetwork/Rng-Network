'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Tooltip } from '@/components/common';
import type { MatrixDesignationItem } from './RoleMatrixRow';

export interface RoleMatrixHeaderProps {
  designations: MatrixDesignationItem[];
  onOpenAddDesignationModal: () => void;
  onDeleteDesignation: (id: string) => void;
}

export const RoleMatrixHeader: React.FC<RoleMatrixHeaderProps> = ({
  designations,
  onOpenAddDesignationModal,
  onDeleteDesignation,
}) => {
  return (
    <thead>
      <tr className="border-b border-white/10 bg-[#0E0F14]/90 backdrop-blur-md">
        {/* Sticky Rank Header Corner */}
        <th
          scope="col"
          className="sticky left-0 top-0 z-30 w-[80px] min-w-[80px] max-w-[80px] px-3 py-2.5 text-left text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 border-r border-white/10 bg-[#0E0F14]"
        >
          Rank
        </th>

        {/* Dynamic Designation Columns */}
        {designations.map((des) => (
          <th
            key={des.id}
            scope="col"
            className="w-[220px] min-w-[220px] max-w-[220px] px-3 py-2.5 text-left font-semibold text-zinc-300 border-r border-white/[0.08] group/col"
          >
            <div className="flex items-center justify-between gap-1.5 w-full">
              <Tooltip
                content={des.name}
                onlyWhenTruncated
                position="bottom"
                className="w-full min-w-0 flex-1"
              >
                <span className="block truncate text-xs font-semibold text-zinc-300 leading-tight">
                  {des.name}
                </span>
              </Tooltip>
              <button
                type="button"
                onClick={() => onDeleteDesignation(des.id)}
                className="opacity-0 group-hover/col:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer shrink-0"
                title={`Delete ${des.name} designation`}
                aria-label={`Delete ${des.name} designation`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </th>
        ))}

        {/* Action Column to Add New Designation */}
        <th
          scope="col"
          className="w-[130px] min-w-[130px] max-w-[130px] px-3 py-2 text-center border-r border-white/[0.08] bg-surface-canvas/20"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenAddDesignationModal}
            leftIcon={<Plus size={13} className="text-brand-red" />}
            className="text-xs text-zinc-400 hover:text-white py-1 px-2.5"
          >
            Add Column
          </Button>
        </th>
      </tr>
    </thead>
  );
};
