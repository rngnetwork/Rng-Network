'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
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
  onOpenAddModal: (rankWeight: number, rankCode: string, designationId: string, designationName: string) => void;
  onDeleteRole: (roleId: string) => void;
  onDeleteRank: (weight: number) => void;
}

export const RoleMatrixRow: React.FC<RoleMatrixRowProps> = ({
  rank,
  designations,
  cells,
  onOpenAddModal,
  onDeleteRole,
  onDeleteRank,
}) => {
  return (
    <tr className="group/row transition-colors hover:bg-white/[0.015]">
      {/* Sticky Left Rank Header */}
      <th
        scope="row"
        className="sticky left-0 z-20 w-[80px] min-w-[80px] max-w-[80px] h-12 min-h-[48px] max-h-[48px] px-2.5 py-1.5 bg-[#0D0E11]/95 backdrop-blur-md border-b border-r border-white/10 text-left align-middle group/rank"
      >
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="neutral"
            size="md"
            className="font-mono font-bold text-xs tracking-wider px-2 py-0.5 border border-white/10 bg-white/[0.04] text-zinc-300"
          >
            {rank.code}
          </Badge>
          <button
            type="button"
            onClick={() => onDeleteRank(rank.weight)}
            className="opacity-0 group-hover/rank:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer shrink-0"
            title={`Delete ${rank.code} row`}
            aria-label={`Delete ${rank.code} row`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </th>

      {/* Designation Cells */}
      {designations.map((des) => {
        const cellKey = `${rank.weight}_${des.id}`;
        const rolesForCell = cells[cellKey] || [];

        return (
          <RoleMatrixCell
            key={cellKey}
            rankCode={rank.code}
            rankWeight={rank.weight}
            designationId={des.id}
            designationName={des.name}
            roles={rolesForCell}
            onOpenAddModal={onOpenAddModal}
            onDeleteRole={onDeleteRole}
          />
        );
      })}

      {/* Trailing cell for Add Column parity */}
      <td className="w-[130px] min-w-[130px] max-w-[130px] border-b border-r border-white/[0.06] bg-surface-canvas/10" />
    </tr>
  );
};
