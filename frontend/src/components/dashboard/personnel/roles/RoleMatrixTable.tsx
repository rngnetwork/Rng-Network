'use client';

import React from 'react';
import { RoleMatrixHeader } from './RoleMatrixHeader';
import { RoleMatrixRow, type MatrixRankItem, type MatrixDesignationItem } from './RoleMatrixRow';
import type { PopoverRoleItem } from './RoleCellDropdownPopover';

export interface RoleMatrixTableProps {
  ranks: MatrixRankItem[];
  designations: MatrixDesignationItem[];
  cells: Record<string, PopoverRoleItem[]>;
  searchQuery?: string;
  onOpenAddModal: (rankWeight: number, rankCode: string, designationId: string, designationName: string) => void;
  onOpenAddDesignationModal: () => void;
  onDeleteRole: (roleId: string) => void;
  onDeleteRank: (weight: number) => void;
  onDeleteDesignation: (id: string) => void;
}

export const RoleMatrixTable: React.FC<RoleMatrixTableProps> = ({
  ranks,
  designations,
  cells,
  searchQuery = '',
  onOpenAddModal,
  onOpenAddDesignationModal,
  onDeleteRole,
  onDeleteRank,
  onDeleteDesignation,
}) => {
  return (
    <div className="w-full rounded-apple-lg border border-white/10 bg-[#0A0A0F] shadow-apple-card overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <table className="border-collapse text-left select-none table-fixed w-max min-w-full">
          <colgroup>
            <col style={{ width: '80px' }} />
            {designations.map((des) => (
              <col key={des.id} style={{ width: '220px' }} />
            ))}
            <col style={{ width: '130px' }} />
          </colgroup>
          <RoleMatrixHeader
            designations={designations}
            onOpenAddDesignationModal={onOpenAddDesignationModal}
            onDeleteDesignation={onDeleteDesignation}
          />
          <tbody>
            {ranks.map((rank) => (
              <RoleMatrixRow
                key={rank.code}
                rank={rank}
                designations={designations}
                cells={cells}
                onOpenAddModal={onOpenAddModal}
                onDeleteRole={onDeleteRole}
                onDeleteRank={onDeleteRank}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
