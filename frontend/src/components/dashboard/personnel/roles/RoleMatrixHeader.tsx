'use client';

import React from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button, Tooltip } from '@/components/common';
import type { MatrixDesignationItem } from './RoleMatrixRow';

export interface RoleMatrixHeaderProps {
  designations: MatrixDesignationItem[];
  selectedDesignationId?: string;
  onSelectDesignation: (id: string, name: string) => void;
  onOpenAddDesignationModal: () => void;
  onDeleteDesignation: (id: string) => void;
  onEditDesignation: (des: MatrixDesignationItem) => void;
}

export const RoleMatrixHeader: React.FC<RoleMatrixHeaderProps> = ({
  designations,
  selectedDesignationId,
  onSelectDesignation,
  onOpenAddDesignationModal,
  onDeleteDesignation,
  onEditDesignation,
}) => {
  return (
    <thead>
      <tr className="border-b border-white/[0.14] bg-[#0E0F14]/90 backdrop-blur-md">
        {/* Sticky Rank Header Corner */}
        <th
          scope="col"
          className="sticky left-0 top-0 z-30 w-[104px] min-w-[104px] max-w-[104px] px-2.5 py-2.5 text-left text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 border-r border-b border-white/[0.14] bg-[#0E0F14]"
        >
          Rank
        </th>

        {/* Dynamic Designation Columns */}
        {designations.map((des) => {
          const isSelected = selectedDesignationId === des.id;

          return (
            <th
              key={des.id}
              scope="col"
              onClick={() => onSelectDesignation(des.id, des.name)}
              className={`w-[224px] min-w-[224px] max-w-[224px] px-3 py-2.5 text-left font-semibold cursor-pointer transition-colors border-b border-r border-white/[0.14] ${
                isSelected
                  ? 'bg-brand-red/[0.08] shadow-[inset_2px_2px_0_0_rgba(225,29,46,0.8),inset_-2px_0_0_0_rgba(225,29,46,0.8)] text-white'
                  : 'text-zinc-300 hover:bg-white/[0.02]'
              }`}
              title="Click to select designation column"
            >
              <div className="flex items-center justify-between gap-1.5 w-full">
                <Tooltip
                  content={des.name}
                  onlyWhenTruncated
                  position="bottom"
                  className="w-full min-w-0 flex-1"
                >
                  <span className="block truncate text-xs font-semibold leading-tight">
                    {des.name}
                  </span>
                </Tooltip>

                {isSelected && (
                  <div className="flex items-center gap-0.5 shrink-0 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDesignation(des);
                      }}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title={`Edit ${des.name} designation`}
                      aria-label={`Edit ${des.name} designation`}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDesignation(des.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                      title={`Delete ${des.name} designation`}
                      aria-label={`Delete ${des.name} designation`}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </th>
          );
        })}

        {/* Action Column to Add New Designation */}
        <th
          scope="col"
          className="w-[130px] min-w-[130px] max-w-[130px] px-3 py-2 text-center border-r border-b border-white/[0.14] bg-surface-canvas/20"
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
