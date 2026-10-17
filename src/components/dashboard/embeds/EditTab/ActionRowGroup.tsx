'use client';

import React from 'react';
import { Plus, Trash2, Settings2, ListChecks } from 'lucide-react';
import {
  ComponentType,
  type DiscordActionRowComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
  type DiscordStringSelectComponent,
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
        <span className="text-[11px] font-mono text-zinc-400">
          {selectMenus.length > 0
            ? '1 Select Menu'
            : `${buttons.length}/5 Buttons`}
        </span>

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
          className="flex items-center justify-between gap-3 p-3 rounded-apple-md bg-[#1E1F22] border border-white/10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ListChecks size={16} className="text-brand-red shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {sel.placeholder || 'Select an option...'}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {'options' in sel && Array.isArray((sel as DiscordStringSelectComponent).options)
                  ? `${(sel as DiscordStringSelectComponent).options.length} options`
                  : `Type ${sel.type} Select`}{' '}
                · ID: {sel.custom_id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEditSelectMenu(sel)}
              aria-label="Configure Select Menu"
              className="p-1.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings2 size={14} />
            </button>
            {sel.id && (
              <button
                type="button"
                onClick={() => onRemoveChild(sel.id!)}
                aria-label="Remove Select Menu"
                className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ActionRowGroup = React.memo(ActionRowGroupInner);
