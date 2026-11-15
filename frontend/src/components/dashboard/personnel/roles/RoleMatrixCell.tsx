'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Badge, Tooltip } from '@/components/common';
import { RoleCellDropdownPopover, type PopoverRoleItem } from './RoleCellDropdownPopover';

export interface RoleMatrixCellProps {
  rankCode: string;
  rankWeight: number;
  designationId: string;
  designationName: string;
  roles: PopoverRoleItem[];
  isSelectedRow?: boolean;
  isSelectedColumn?: boolean;
  isLastRow?: boolean;
  onOpenAddModal: (rankWeight: number, rankCode: string, designationId: string, designationName: string) => void;
  onDeleteRole: (roleId: string) => void;
  onEditRole?: (role: PopoverRoleItem) => void;
}

export const RoleMatrixCell: React.FC<RoleMatrixCellProps> = ({
  rankCode,
  rankWeight,
  designationId,
  designationName,
  roles,
  isSelectedRow = false,
  isSelectedColumn = false,
  isLastRow = false,
  onOpenAddModal,
  onDeleteRole,
  onEditRole,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasRoles = roles.length > 0;
  const primaryRole = roles[0];

  const selectionClass = isSelectedRow && isSelectedColumn
    ? 'shadow-[inset_2px_2px_0_0_rgba(225,29,46,0.9),inset_-2px_-2px_0_0_rgba(225,29,46,0.9)] bg-brand-red/[0.08]'
    : isSelectedRow
    ? 'shadow-[inset_0_2px_0_0_rgba(225,29,46,0.7),inset_0_-2px_0_0_rgba(225,29,46,0.7)] bg-brand-red/[0.04]'
    : isSelectedColumn
    ? (isLastRow
        ? 'shadow-[inset_2px_0_0_0_rgba(225,29,46,0.8),inset_-2px_0_0_0_rgba(225,29,46,0.8),inset_0_-2px_0_0_rgba(225,29,46,0.8)] bg-brand-red/[0.04]'
        : 'shadow-[inset_2px_0_0_0_rgba(225,29,46,0.7),inset_-2px_0_0_0_rgba(225,29,46,0.7)] bg-brand-red/[0.04]')
    : 'bg-surface-canvas/40 hover:bg-white/[0.02]';

  return (
    <td
      className={`relative w-[224px] min-w-[224px] max-w-[224px] h-12 min-h-[48px] max-h-[48px] px-2.5 py-1.5 align-middle transition-colors border-b border-r border-white/[0.14] ${selectionClass}`}
    >
      <div className="flex items-center justify-between gap-1.5 h-full w-full">
        {hasRoles ? (
          <div className="flex-1 min-w-0 w-full">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center justify-between gap-1.5 h-8.5 px-2.5 py-1 rounded-apple-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 transition-colors cursor-pointer w-full text-left group"
              aria-label={`View roles for ${designationName} at ${rankCode}`}
            >
              <Tooltip
                content={primaryRole.name}
                onlyWhenTruncated
                position="top"
                className="flex-1 min-w-0"
              >
                <span className="block truncate text-xs font-medium text-zinc-200 leading-none">
                  {primaryRole.name}
                </span>
              </Tooltip>

              {roles.length > 1 && (
                <Badge
                  variant="neutral"
                  size="sm"
                  className="px-1.5 py-0 text-[10px] shrink-0 font-mono bg-white/[0.08] text-zinc-300 border border-white/10"
                >
                  +{roles.length - 1}
                </Badge>
              )}

              <ChevronDown
                size={12}
                className={`ml-auto shrink-0 text-zinc-400 group-hover:text-white transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0 w-full flex items-center justify-center h-8.5">
            <span className="text-zinc-600/40 select-none font-mono text-sm leading-none">—</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenAddModal(rankWeight, rankCode, designationId, designationName)}
          className="p-1.5 w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] rounded-apple-sm text-zinc-500 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer shrink-0 flex items-center justify-center"
          title={`Add role to ${designationName} at ${rankCode}`}
          aria-label={`Add role to ${designationName} at ${rankCode}`}
        >
          <Plus size={13} />
        </button>
      </div>

      <RoleCellDropdownPopover
        roles={roles}
        rankCode={rankCode}
        designationName={designationName}
        isOpen={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
        triggerRef={triggerRef}
        onDeleteRole={onDeleteRole}
        onEditRole={onEditRole}
        onAddAnother={() => onOpenAddModal(rankWeight, rankCode, designationId, designationName)}
      />
    </td>
  );
};
