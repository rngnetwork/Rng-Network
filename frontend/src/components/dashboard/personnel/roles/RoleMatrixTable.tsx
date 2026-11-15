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
  selectedRankWeight?: number;
  selectedDesignationId?: string;
  onSelectRank: (weight: number, code: string) => void;
  onSelectDesignation: (id: string, name: string) => void;
  onOpenAddModal: (rankWeight: number, rankCode: string, designationId: string, designationName: string) => void;
  onOpenAddDesignationModal: () => void;
  onDeleteRole: (roleId: string) => void;
  onEditRole: (role: PopoverRoleItem) => void;
  onDeleteRank: (weight: number) => void;
  onEditRank: (rank: MatrixRankItem) => void;
  onDeleteDesignation: (id: string) => void;
  onEditDesignation: (des: MatrixDesignationItem) => void;
}

export const RoleMatrixTable: React.FC<RoleMatrixTableProps> = ({
  ranks,
  designations,
  cells,
  selectedRankWeight,
  selectedDesignationId,
  onSelectRank,
  onSelectDesignation,
  onOpenAddModal,
  onOpenAddDesignationModal,
  onDeleteRole,
  onEditRole,
  onDeleteRank,
  onEditRank,
  onDeleteDesignation,
  onEditDesignation,
}) => {
  return (
    <div className="w-full rounded-apple-lg border border-white/10 bg-[#0A0A0F] shadow-apple-card overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <table className="border-collapse text-left select-none table-fixed w-max min-w-full">
          <colgroup>
            <col style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }} />
            {designations.map((des) => (
              <col key={des.id} style={{ width: '224px', minWidth: '224px', maxWidth: '224px' }} />
            ))}
            <col style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }} />
          </colgroup>
          <RoleMatrixHeader
            designations={designations}
            selectedDesignationId={selectedDesignationId}
            onSelectDesignation={onSelectDesignation}
            onOpenAddDesignationModal={onOpenAddDesignationModal}
            onDeleteDesignation={onDeleteDesignation}
            onEditDesignation={onEditDesignation}
          />
          <tbody>
            {ranks.map((rank, index) => (
              <RoleMatrixRow
                key={rank.code}
                rank={rank}
                designations={designations}
                cells={cells}
                isSelected={selectedRankWeight === rank.weight}
                isLastRow={index === ranks.length - 1}
                selectedDesignationId={selectedDesignationId}
                onSelectRank={onSelectRank}
                onOpenAddModal={onOpenAddModal}
                onDeleteRole={onDeleteRole}
                onEditRole={onEditRole}
                onDeleteRank={onDeleteRank}
                onEditRank={onEditRank}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
