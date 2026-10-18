'use client';

import React from 'react';
import { Plus, Settings2, ChevronDown } from 'lucide-react';
import {
  ComponentType,
  type DiscordActionRowComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
  type DiscordActionRowChild,
} from '@/lib/model/embed';
import { ButtonComponentNode } from './ButtonComponentNode';

export interface ActionRowGroupProps {
  row: DiscordActionRowComponent;
  onAddButtonToRow: () => void;
  onEditButton: (button: DiscordButtonComponent) => void;
  onEditSelectMenu: (select: DiscordSelectComponent) => void;
  onRemoveChild: (childId: string) => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateRowComponents?: (components: DiscordActionRowChild[]) => void;
}

const ActionRowGroupInner: React.FC<ActionRowGroupProps> = ({
  row,
  onAddButtonToRow,
  onEditButton,
  onEditSelectMenu,
  onRemoveChild,
  onRemoveRow,
  onUpdateRowComponents,
}) => {
  const buttons = row.components.filter(
    (c): c is DiscordButtonComponent => c.type === ComponentType.BUTTON
  );
  const selectMenus = row.components.filter(
    (c): c is DiscordSelectComponent =>
      c.type === ComponentType.STRING_SELECT ||
      c.type === ComponentType.USER_SELECT ||
      c.type === ComponentType.ROLE_SELECT ||
      c.type === ComponentType.MENTIONABLE_SELECT ||
      c.type === ComponentType.CHANNEL_SELECT
  );
  const canAppendButton = selectMenus.length === 0 && buttons.length < 5;

  const handleShiftLeft = (bIdx: number) => {
    if (bIdx <= 0 || !onUpdateRowComponents) return;
    const items = [...row.components];
    const temp = items[bIdx - 1];
    items[bIdx - 1] = items[bIdx];
    items[bIdx] = temp;
    onUpdateRowComponents(items);
  };

  const handleShiftRight = (bIdx: number) => {
    if (!onUpdateRowComponents || bIdx >= buttons.length - 1) return;
    const items = [...row.components];
    const temp = items[bIdx + 1];
    items[bIdx + 1] = items[bIdx];
    items[bIdx] = temp;
    onUpdateRowComponents(items);
  };

  const handleLabelChange = (bIdx: number, newLabel: string) => {
    if (!onUpdateRowComponents) return;
    const items = row.components.map((c, i) =>
      i === bIdx && c.type === ComponentType.BUTTON ? { ...c, label: newLabel } : c
    );
    onUpdateRowComponents(items);
  };

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {buttons.length > 0 && (
          <span className="text-[11px] font-mono text-zinc-400">
            {buttons.length}/5 Buttons
          </span>
        )}
        {buttons.length === 0 && <div />}

        <div className="flex items-center gap-2">
          {canAppendButton && (
            <button
              type="button"
              onClick={onAddButtonToRow}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-apple-sm bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-zinc-200 transition-colors"
            >
              <Plus size={12} />
              <span>Add Button</span>
            </button>
          )}
        </div>
      </div>

      {buttons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {buttons.map((btn, idx) => (
            <ButtonComponentNode
              key={btn.id || `btn_${idx}`}
              button={btn}
              bIdx={idx}
              totalButtons={buttons.length}
              onEdit={onEditButton}
              onRemove={onRemoveChild}
              onShiftLeft={handleShiftLeft}
              onShiftRight={handleShiftRight}
              onLabelChange={handleLabelChange}
            />
          ))}
        </div>
      )}

      {selectMenus.map((sel, idx) => (
        <div
          key={sel.id || `sel_${idx}`}
          onClick={() => onEditSelectMenu(sel)}
          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-apple-md bg-[#111214] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group select-none"
        >
          <span className="text-xs text-zinc-400 font-medium truncate">
            {sel.placeholder || 'Select an option...'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditSelectMenu(sel);
              }}
              title="Configure Select Menu"
              aria-label="Configure Select Menu"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Settings2 size={13} />
            </button>
            <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ActionRowGroup = React.memo(ActionRowGroupInner);
