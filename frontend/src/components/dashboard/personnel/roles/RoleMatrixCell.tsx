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
  onOpenAddModal: (rankWeight: number, rankCode: string, designationId: string, designationName: string) => void;
  onDeleteRole: (roleId: string) => void;
}

export const RoleMatrixCell: React.FC<RoleMatrixCellProps> = ({
  rankCode,
  rankWeight,
  designationId,
  designationName,
  roles,
  onOpenAddModal,
  onDeleteRole,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasRoles = roles.length > 0;
  const primaryRole = roles[0];

  return (
    <td className="relative w-[220px] min-w-[220px] max-w-[220px] h-12 min-h-[48px] max-h-[48px] px-2.5 py-1.5 border-b border-r border-white/[0.06] align-middle bg-surface-canvas/40 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center justify-between gap-1.5 h-full w-full">
        {hasRoles ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 h-8.5 px-2.5 py-1 rounded-apple-sm bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 transition-colors cursor-pointer w-full min-w-0 flex-1 text-left group"
            aria-label={`View roles for ${designationName} at ${rankCode}`}
          >
            <Tooltip
              content={primaryRole.name}
              onlyWhenTruncated
              position="top"
              className="w-full min-w-0 flex-1"
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
              className={`ml-auto text-zinc-400 group-hover:text-white transition-transform shrink-0 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        ) : (
          <div className="flex-1 w-full flex items-center justify-center h-8.5">
            <span className="text-zinc-600/40 select-none font-mono text-sm leading-none">—</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenAddModal(rankWeight, rankCode, designationId, designationName)}
          className="p-1.5 rounded-apple-sm text-zinc-500 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer shrink-0"
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
        onAddAnother={() => onOpenAddModal(rankWeight, rankCode, designationId, designationName)}
      />
    </td>
  );
};
