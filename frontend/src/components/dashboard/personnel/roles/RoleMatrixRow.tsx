'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/common';
import { RoleMatrixCell } from './RoleMatrixCell';
import type {
  MatrixRankItem,
  MatrixDesignationItem,
  PopoverRoleItem,
} from '@/lib/api/dashboard/personnel';

export type { MatrixRankItem, MatrixDesignationItem };

export interface RoleMatrixRowProps {
  rank: MatrixRankItem;
  designations: MatrixDesignationItem[];
  cells: Record<string, PopoverRoleItem[]>;
  isSelected?: boolean;
  isLastRow?: boolean;
  selectedDesignationId?: string;
  onSelectRank: (weight: number, code: string) => void;
  onOpenAddModal: (rankWeight: number, rankCode: string, designationId: string, designationName: string) => void;
  onDeleteRole: (roleId: string) => void;
  onEditRole?: (role: PopoverRoleItem) => void;
  onDeleteRank: (weight: number) => void;
  onEditRank: (rank: MatrixRankItem) => void;
}

export const RoleMatrixRow: React.FC<RoleMatrixRowProps> = ({
  rank,
  designations,
  cells,
  isSelected = false,
  isLastRow = false,
  selectedDesignationId,
  onSelectRank,
  onOpenAddModal,
  onDeleteRole,
  onEditRole,
  onDeleteRank,
  onEditRank,
}) => {
  return (
    <tr
      className={`group/row transition-colors ${
        isSelected ? 'bg-brand-red/[0.04]' : 'hover:bg-white/[0.015]'
      }`}
    >
      {/* Sticky Left Rank Header */}
      <th
        scope="row"
        onClick={() => onSelectRank(rank.weight, rank.code)}
        className={`sticky left-0 z-20 w-[104px] min-w-[104px] max-w-[104px] h-12 min-h-[48px] max-h-[48px] px-2 py-1.5 backdrop-blur-md text-left align-middle cursor-pointer transition-colors border-b border-r border-white/[0.14] ${
          isSelected
            ? 'bg-[#150A0E] shadow-[inset_2px_2px_0_0_rgba(225,29,46,0.8),inset_0_-2px_0_0_rgba(225,29,46,0.8)]'
            : 'bg-[#0D0E11]/95 hover:bg-[#121318]'
        }`}
        title="Click to select rank row"
      >
        <div className="flex items-center justify-between gap-1 w-full">
          <Badge
            variant="neutral"
            size="md"
            className={`font-mono font-bold text-xs tracking-wider px-2 py-0.5 border transition-all shrink-0 ${
              isSelected
                ? 'border-brand-red/60 bg-brand-red/20 text-white shadow-sm ring-1 ring-brand-red/40'
                : 'border-white/10 bg-white/[0.04] text-zinc-300'
            }`}
          >
            {rank.code}
          </Badge>

          {isSelected && (
            <div className="flex items-center gap-0.5 shrink-0 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRank(rank);
                }}
                className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title={`Edit ${rank.code} rank`}
                aria-label={`Edit ${rank.code} rank`}
              >
                <Pencil size={11} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRank(rank.weight);
                }}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                title={`Delete ${rank.code} rank`}
                aria-label={`Delete ${rank.code} rank`}
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
      </th>

      {/* Designation Cells */}
      {designations.map((des) => {
        const cellKey = `${rank.weight}_${des.id}`;
        const rolesForCell = cells[cellKey] || [];
        const isColSelected = selectedDesignationId === des.id;

        return (
          <RoleMatrixCell
            key={cellKey}
            rankCode={rank.code}
            rankWeight={rank.weight}
            designationId={des.id}
            designationName={des.name}
            roles={rolesForCell}
            isSelectedRow={isSelected}
            isSelectedColumn={isColSelected}
            isLastRow={isLastRow}
            onOpenAddModal={onOpenAddModal}
            onDeleteRole={onDeleteRole}
            onEditRole={onEditRole}
          />
        );
      })}

      {/* Trailing cell for Add Column parity */}
      <td
        className={`w-[130px] min-w-[130px] max-w-[130px] transition-colors border-b border-r border-white/[0.14] ${
          isSelected
            ? 'bg-brand-red/[0.04] shadow-[inset_0_2px_0_0_rgba(225,29,46,0.8),inset_-2px_0_0_0_rgba(225,29,46,0.8),inset_0_-2px_0_0_rgba(225,29,46,0.8)]'
            : 'bg-surface-canvas/10'
        }`}
      />
    </tr>
  );
};
