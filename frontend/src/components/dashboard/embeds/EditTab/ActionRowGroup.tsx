'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, Check, User, Shield, Hash, AtSign } from 'lucide-react';
import {
  ComponentType,
  type DiscordActionRowComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
  type DiscordStringSelectComponent,
  type DiscordActionRowChild,
} from '@/lib/model/embed';
import { DiscordEmoji } from '../emoji/DiscordEmojiRenderer';
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
  onRemoveChild,
  onUpdateRowComponents,
}) => {
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [selectedOptionByMenuId, setSelectedOptionByMenuId] = useState<Record<string, string>>({});

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

      {selectMenus.map((sel, idx) => {
        const menuKey = sel.id || `sel_${idx}`;
        const isType3 = sel.type === ComponentType.STRING_SELECT;
        const isExpanded = isType3 && expandedMenuId === menuKey;
        const selectedValue = selectedOptionByMenuId[menuKey];
        const isUserSelect = sel.type === ComponentType.USER_SELECT;
        const isRoleSelect = sel.type === ComponentType.ROLE_SELECT;
        const isChannelSelect = sel.type === ComponentType.CHANNEL_SELECT;
        const isMentionableSelect = sel.type === ComponentType.MENTIONABLE_SELECT;

        const stringOptions = isType3
          ? (sel as DiscordStringSelectComponent).options || []
          : [];

        const selectedOpt = isType3
          ? stringOptions.find(
              (o) => o.value === selectedValue || (!selectedValue && o.default)
            )
          : undefined;

        return (
          <div key={menuKey} className="flex flex-col">
            <div
              onClick={() => {
                if (isType3) {
                  setExpandedMenuId((prev) => (prev === menuKey ? null : menuKey));
                }
              }}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-apple-md bg-[#111214] border transition-all select-none ${
                isType3
                  ? isExpanded
                    ? 'border-white/30 ring-1 ring-white/10 cursor-pointer'
                    : 'border-white/[0.08] hover:border-white/20 cursor-pointer group'
                  : 'border-white/[0.08] cursor-default'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isType3 && selectedOpt?.emoji && (
                  <DiscordEmoji emoji={selectedOpt.emoji} className="w-4 h-4 object-contain shrink-0" />
                )}
                {isUserSelect && (
                  <User size={14} className="text-zinc-400 shrink-0" />
                )}
                {isRoleSelect && (
                  <Shield size={14} className="text-zinc-400 shrink-0" />
                )}
                {isChannelSelect && (
                  <Hash size={14} className="text-zinc-400 shrink-0" />
                )}
                {isMentionableSelect && (
                  <AtSign size={14} className="text-zinc-400 shrink-0" />
                )}
                <span
                  className={`text-xs font-medium truncate ${
                    selectedOpt ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {selectedOpt?.label ||
                    sel.placeholder ||
                    (isUserSelect
                      ? 'Select a user...'
                      : isRoleSelect
                      ? 'Select a role...'
                      : isChannelSelect
                      ? 'Select a channel...'
                      : 'Select an option...')}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform duration-200 shrink-0 ${
                  isExpanded ? 'rotate-180 text-white' : ''
                }`}
              />
            </div>

            {isType3 && isExpanded && (
              <div className="mt-1.5 p-1 rounded-apple-md bg-[#111214] border border-white/10 shadow-xl flex flex-col gap-0.5 z-10 animate-in fade-in-50 zoom-in-95 duration-100">
                {stringOptions.length > 0 ? (
                  stringOptions.map((opt, optIdx) => {
                    const isSelected =
                      selectedValue === opt.value || (!selectedValue && Boolean(opt.default));
                    return (
                      <div
                        key={opt.value || optIdx}
                        onClick={() => {
                          setSelectedOptionByMenuId((prev) => ({
                            ...prev,
                            [menuKey]: opt.value,
                          }));
                          setExpandedMenuId(null);
                        }}
                        className={`flex items-start justify-between gap-2.5 px-3 py-2 rounded-apple-sm transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 text-white'
                            : 'hover:bg-white/[0.06] text-zinc-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {opt.emoji && (
                            <div className="pt-0.5 shrink-0">
                              <DiscordEmoji
                                emoji={opt.emoji}
                                className="w-4 h-4 object-contain"
                              />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-white truncate">
                              {opt.label || opt.value}
                            </span>
                            {opt.description && (
                              <span className="text-[11px] text-zinc-400 line-clamp-1">
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={14} className="text-brand-red shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-2.5 text-center text-xs text-zinc-500">
                    No options configured. Click the settings gear in header to add options.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const ActionRowGroup = React.memo(ActionRowGroupInner);
