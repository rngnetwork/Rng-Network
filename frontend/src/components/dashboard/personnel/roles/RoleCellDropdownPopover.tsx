'use client';

import React, { useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { Button, Tooltip } from '@/components/common';
import type { PopoverRoleItem } from '@/lib/api/dashboard/personnel';

export type { PopoverRoleItem };

export interface RoleCellDropdownPopoverProps {
  roles: PopoverRoleItem[];
  rankCode: string;
  designationName: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onDeleteRole: (roleId: string) => void;
  onAddAnother: () => void;
}

export const RoleCellDropdownPopover: React.FC<RoleCellDropdownPopoverProps> = ({
  roles,
  rankCode,
  designationName,
  isOpen,
  onClose,
  triggerRef,
  onDeleteRole,
  onAddAnother,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1.5 w-64 z-50 rounded-apple-md bg-[#13131A] border border-white/10 shadow-2xl p-2.5 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[11px] font-mono font-bold text-zinc-300 shrink-0">{rankCode}</span>
          <Tooltip
            content={designationName}
            onlyWhenTruncated
            position="top"
            className="min-w-0 flex-1 overflow-hidden block"
          >
            <span className="text-[11px] text-zinc-400 font-medium truncate block">
              {designationName}
            </span>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-none">
        {roles.map((role) => (
          <div
            key={role.id}
            className="group flex items-center justify-between px-2 py-1.5 rounded-apple-sm bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs transition-colors"
          >
            <div className="min-w-0 flex-1 pr-1">
              <Tooltip
                content={role.name}
                onlyWhenTruncated
                position="top"
                className="w-full min-w-0 flex-1"
              >
                <span className="block text-zinc-200 font-medium truncate text-xs">
                  {role.name}
                </span>
              </Tooltip>
            </div>
            <button
              type="button"
              onClick={() => onDeleteRole(role.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer shrink-0"
              title="Remove role from this cell"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-white/[0.08]">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onClose();
            onAddAnother();
          }}
          leftIcon={<Plus size={12} />}
          className="w-full text-xs font-semibold py-1 min-h-[30px]"
        >
          Add Role Here
        </Button>
      </div>
    </div>
  );
};
