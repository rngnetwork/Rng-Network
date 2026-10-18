'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  MousePointerClick,
  Check,
  Unlink,
  AlertCircle,
  HelpCircle,
  Smile,
  X,
  Layers,
} from 'lucide-react';
import {
  ComponentType,
  type DiscordSelectComponent,
  type DiscordSelectOption,
  type DiscordButtonComponent,
  type DiscordActionRowComponent,
  type Type17Container,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import { DiscordEmoji } from '@/components/dashboard/embeds/emoji/DiscordEmojiRenderer';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { Button } from '@/components/common/input/Button';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';

export interface SelectMenuConfigModalProps {
  isOpen: boolean;
  selectMenu: DiscordSelectComponent | null;
  availableActions?: EmbedAction[];
  allContainers?: Type17Container[];
  onUpdateContainers?: (updated: Type17Container[]) => void;
  onOpenEmojiPicker?: (onSelect: (token: string) => void) => void;
  onClose: () => void;
  onSave: (updated: DiscordSelectComponent) => void;
}

interface ButtonItemRef {
  cIdx: number;
  rowId?: string;
  btnIdx: number;
  button: DiscordButtonComponent;
}

export const SelectMenuConfigModal: React.FC<SelectMenuConfigModalProps> = ({
  isOpen,
  selectMenu,
  availableActions = [],
  allContainers = [],
  onUpdateContainers,
  onOpenEmojiPicker,
  onClose,
  onSave,
}) => {
  const [prevSelectMenu, setPrevSelectMenu] = useState(selectMenu);
  const [customId, setCustomId] = useState(selectMenu?.custom_id ?? 'rng_sel_default');
  const [placeholder, setPlaceholder] = useState(selectMenu?.placeholder ?? 'Select an option...');
  const [disabled, setDisabled] = useState<boolean>(Boolean(selectMenu?.disabled));

  // Determine initial action binding for Type 5 / 6
  const initialActionId = useMemo(() => {
    if (!selectMenu) return '';
    const cid = selectMenu.custom_id || '';
    if (cid.startsWith('rng_sel_user_')) return cid.replace('rng_sel_user_', '');
    if (cid.startsWith('rng_sel_role_')) return cid.replace('rng_sel_role_', '');
    return '';
  }, [selectMenu]);

  const [actionSourceMode, setActionSourceMode] = useState<'template' | 'custom'>(
    initialActionId ? 'template' : 'custom'
  );
  const [selectedActionId, setSelectedActionId] = useState<string>(initialActionId);

  const [options, setOptions] = useState<DiscordSelectOption[]>(
    selectMenu && 'options' in selectMenu && selectMenu.options && selectMenu.options.length > 0
      ? selectMenu.options
      : [{ label: 'Option 1', value: 'opt_1', description: '' }]
  );

  // Collect all buttons across all containers
  const allButtons = useMemo<ButtonItemRef[]>(() => {
    const list: ButtonItemRef[] = [];
    allContainers.forEach((c, cIdx) => {
      (c.components || []).forEach((inner) => {
        if (inner.type === ComponentType.ACTION_ROW) {
          const actionRow = inner as DiscordActionRowComponent;
          actionRow.components.forEach((item, btnIdx) => {
            if (item.type === ComponentType.BUTTON) {
              list.push({
                cIdx,
                rowId: inner.id,
                btnIdx,
                button: item as DiscordButtonComponent,
              });
            }
          });
        }
      });
    });
    return list;
  }, [allContainers]);

  // Scan allContainers to check 1-of-each usage across User Select, Role Select, and Button
  const actionUsages = useMemo(() => {
    const usages = new Map<string, { userSelect?: string; roleSelect?: string; button?: string; buttonLabel?: string }>();
    allContainers.forEach((c) => {
      (c.components || []).forEach((inner) => {
        const compRec = inner as unknown as Record<string, unknown>;
        const t = Number(compRec.type);
        const cid = String(compRec.custom_id || '');

        if (t === ComponentType.USER_SELECT) {
          const aId = cid.startsWith('rng_sel_user_') ? cid.replace('rng_sel_user_', '') : undefined;
          if (aId) {
            const entry = usages.get(aId) || {};
            entry.userSelect = String(compRec.id || cid);
            usages.set(aId, entry);
          }
        } else if (t === ComponentType.ROLE_SELECT) {
          const aId = cid.startsWith('rng_sel_role_') ? cid.replace('rng_sel_role_', '') : undefined;
          if (aId) {
            const entry = usages.get(aId) || {};
            entry.roleSelect = String(compRec.id || cid);
            usages.set(aId, entry);
          }
        } else if (t === ComponentType.ACTION_ROW) {
          const row = inner as DiscordActionRowComponent;
          row.components.forEach((child) => {
            if (child.type === ComponentType.BUTTON && child.custom_id?.startsWith('rng_act_')) {
              const entry = usages.get(child.custom_id) || {};
              entry.button = child.id || child.custom_id;
              entry.buttonLabel = child.label || 'Action Button';
              usages.set(child.custom_id, entry);
            }
          });
        }
      });
    });
    return usages;
  }, [allContainers]);

  // Determine currently mapped invoker button
  const currentInvokerCustomId = `rng_btn_invoke_${selectMenu?.custom_id || selectMenu?.id}`;
  const initialMappedButton = useMemo(() => {
    if (!selectMenu) return null;
    const invokerId = 'invokerButtonId' in selectMenu ? (selectMenu as { invokerButtonId?: string }).invokerButtonId : undefined;
    return (
      allButtons.find(
        (b) =>
          b.button.custom_id === currentInvokerCustomId ||
          invokerId === b.button.id ||
          invokerId === b.button.custom_id ||
          (b.button.custom_id && b.button.custom_id.startsWith(`rng_btn_invoke_${selectMenu.custom_id}`))
      ) || (allButtons.length === 1 ? allButtons[0] : null)
    );
  }, [allButtons, currentInvokerCustomId, selectMenu]);

  const [mappedButton, setMappedButton] = useState<ButtonItemRef | null>(initialMappedButton);
  const [isButtonPickerOpen, setIsButtonPickerOpen] = useState(false);
  const [tempSelectedButton, setTempSelectedButton] = useState<ButtonItemRef | null>(initialMappedButton);

  if (selectMenu !== prevSelectMenu) {
    setPrevSelectMenu(selectMenu);
    setCustomId(selectMenu?.custom_id || 'rng_sel_default');
    setPlaceholder(
      selectMenu?.placeholder ??
        (selectMenu?.type === ComponentType.USER_SELECT
          ? 'Select a user...'
          : selectMenu?.type === ComponentType.ROLE_SELECT
          ? 'Select a role...'
          : 'Select an option...')
    );
    setDisabled(Boolean(selectMenu?.disabled));
    setOptions(
      selectMenu && 'options' in selectMenu && selectMenu.options && selectMenu.options.length > 0
        ? selectMenu.options
        : [{ label: 'Option 1', value: 'opt_1', description: '' }]
    );
    const cid = selectMenu?.custom_id || '';
    const aId = cid.startsWith('rng_sel_user_')
      ? cid.replace('rng_sel_user_', '')
      : cid.startsWith('rng_sel_role_')
      ? cid.replace('rng_sel_role_', '')
      : '';
    setSelectedActionId(aId);
    setActionSourceMode(aId ? 'template' : 'custom');
    setMappedButton(initialMappedButton);
    setTempSelectedButton(initialMappedButton);
  }

  const actionOptions: DropdownOption<string>[] = useMemo(() => {
    return [
      {
        value: '',
        label: 'None (Unbound)',
        description: 'Do not bind this select menu to an action template',
      },
      ...availableActions.map((act) => {
        const usage = actionUsages.get(act.actionId);
        const isAnotherUserSelect =
          selectMenu?.type === ComponentType.USER_SELECT &&
          usage?.userSelect &&
          usage.userSelect !== selectMenu.id &&
          usage.userSelect !== selectMenu.custom_id;
        const isAnotherRoleSelect =
          selectMenu?.type === ComponentType.ROLE_SELECT &&
          usage?.roleSelect &&
          usage.roleSelect !== selectMenu.id &&
          usage.roleSelect !== selectMenu.custom_id;
        const isBlocked = Boolean(isAnotherUserSelect || isAnotherRoleSelect);

        return {
          value: act.actionId,
          label: act.name,
          description: isBlocked
            ? `⚠️ Already mapped to another ${selectMenu?.type === ComponentType.USER_SELECT ? 'User' : 'Role'} Select in this message`
            : act.description || act.actionId,
          disabled: isBlocked,
        };
      }),
    ];
  }, [availableActions, actionUsages, selectMenu]);

  const hasActionTemplates = useMemo(
    () => actionOptions.some((a) => a.value !== ''),
    [actionOptions]
  );

  const handleUpdateOption = (idx: number, updates: Partial<DiscordSelectOption>) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? { ...opt, ...updates } : opt)));
  };

  const handleAddOption = () => {
    if (options.length >= 25) return;
    setOptions((prev) => [
      ...prev,
      {
        label: `Option ${prev.length + 1}`,
        value: `opt_${Date.now()}_${prev.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!selectMenu) return;

    const isType3 = selectMenu.type === ComponentType.STRING_SELECT;
    const isType5 = selectMenu.type === ComponentType.USER_SELECT;
    const isType6 = selectMenu.type === ComponentType.ROLE_SELECT;

    const finalCustomId =
      isType5 && actionSourceMode === 'template' && selectedActionId
        ? `rng_sel_user_${selectedActionId}`
        : isType6 && actionSourceMode === 'template' && selectedActionId
        ? `rng_sel_role_${selectedActionId}`
        : customId.trim() || selectMenu.custom_id || `rng_sel_${Date.now()}`;

    const targetBtnInvokeId = mappedButton ? `rng_btn_invoke_${finalCustomId}` : undefined;

    // If String Select (Type 3) and invoker button mapping changed, update containers
    if (isType3 && onUpdateContainers && allContainers.length > 0) {
      const invokeId = targetBtnInvokeId || `rng_btn_invoke_${finalCustomId}`;
      const updatedContainers = JSON.parse(JSON.stringify(allContainers)) as Type17Container[];

      // Reset old invokeId on any unmapped buttons
      updatedContainers.forEach((c) => {
        (c.components || []).forEach((inner) => {
          if (inner.type === ComponentType.ACTION_ROW) {
            const row = inner as DiscordActionRowComponent;
            row.components.forEach((item) => {
              if (item.type === ComponentType.BUTTON) {
                const btn = item as DiscordButtonComponent;
                if (btn.custom_id === invokeId) {
                  btn.custom_id = `btn_${Date.now()}`;
                }
              }
            });
          }
        });
      });

      // Apply invokeId to mapped button
      if (mappedButton) {
        let applied = false;
        updatedContainers.forEach((c, cIdx) => {
          if (cIdx === mappedButton.cIdx) {
            (c.components || []).forEach((inner) => {
              if (inner.type === ComponentType.ACTION_ROW) {
                const row = inner as DiscordActionRowComponent;
                row.components.forEach((item, btnIdx) => {
                  if (
                    item.type === ComponentType.BUTTON &&
                    (item.id === mappedButton.button.id ||
                      (inner.id === mappedButton.rowId && btnIdx === mappedButton.btnIdx))
                  ) {
                    (item as DiscordButtonComponent).custom_id = invokeId;
                    applied = true;
                  }
                });
              }
            });
          }
        });

        if (!applied) {
          updatedContainers.forEach((c) => {
            (c.components || []).forEach((inner) => {
              if (inner.type === ComponentType.ACTION_ROW) {
                const row = inner as DiscordActionRowComponent;
                row.components.forEach((item) => {
                  if (item.type === ComponentType.BUTTON && item.id === mappedButton.button.id) {
                    (item as DiscordButtonComponent).custom_id = invokeId;
                  }
                });
              }
            });
          });
        }
      }

      onUpdateContainers(updatedContainers);
    }

    if (isType3) {
      onSave({
        ...selectMenu,
        type: ComponentType.STRING_SELECT,
        custom_id: finalCustomId,
        placeholder: placeholder.trim() || undefined,
        disabled,
        options,
        invokerButtonId: targetBtnInvokeId,
      });
    } else {
      onSave({
        ...selectMenu,
        custom_id: finalCustomId,
        placeholder: placeholder.trim() || undefined,
        disabled,
      });
    }

    onClose();
  };

  const getButtonStyleInfo = (style?: number) => {
    switch (style) {
      case 2:
        return { name: 'Secondary (Grey)', bg: 'bg-[#4E5058]' };
      case 3:
        return { name: 'Success (Green)', bg: 'bg-[#23A55A]' };
      case 4:
        return { name: 'Danger (Red)', bg: 'bg-[#DA373C]' };
      case 5:
        return { name: 'Link (URL)', bg: 'bg-[#4E5058]' };
      case 1:
      default:
        return { name: 'Primary (Blurple)', bg: 'bg-[#5865F2]' };
    }
  };

  const isType3 = selectMenu?.type === ComponentType.STRING_SELECT;
  const isEntitySelect =
    selectMenu?.type === ComponentType.USER_SELECT ||
    selectMenu?.type === ComponentType.ROLE_SELECT ||
    selectMenu?.type === ComponentType.MENTIONABLE_SELECT ||
    selectMenu?.type === ComponentType.CHANNEL_SELECT;

  const currentActionUsage = selectedActionId ? actionUsages.get(selectedActionId) : undefined;

  const modalTitle = isType3
    ? 'String Select Settings'
    : selectMenu?.type === ComponentType.USER_SELECT
    ? 'User Select Settings'
    : selectMenu?.type === ComponentType.ROLE_SELECT
    ? 'Role Select Settings'
    : 'Select Menu Settings';

  const modalDescription = isType3
    ? 'Configure settings of String Select in the embedded message'
    : selectMenu?.type === ComponentType.USER_SELECT
    ? 'Configure settings of User Select in the embedded message'
    : selectMenu?.type === ComponentType.ROLE_SELECT
    ? 'Configure settings of Role Select in the embedded message'
    : 'Configure settings of Select Menu in the embedded message';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        description={modalDescription}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isType3 ? !customId.trim() || options.length === 0 : false}
              onClick={handleSave}
            >
              Save Select Menu
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* User Select (Type 5) or Role Select (Type 6) Binding */}
          {isEntitySelect && (
            <div className="p-3.5 rounded-apple-lg bg-surface-card border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers size={14} className="text-emerald-400" />
                  Action Registry Template Binding
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActionSourceMode('template')}
                    className={`px-2.5 py-1 rounded-apple-sm text-xs font-semibold transition-colors cursor-pointer ${
                      actionSourceMode === 'template'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Action Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionSourceMode('custom')}
                    className={`px-2.5 py-1 rounded-apple-sm text-xs font-semibold transition-colors cursor-pointer ${
                      actionSourceMode === 'custom'
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Custom ID
                  </button>
                </div>
              </div>

              {actionSourceMode === 'template' ? (
                <div className="flex flex-col gap-2.5">
                  <Dropdown
                    label="Select Action Template"
                    options={actionOptions}
                    value={selectedActionId}
                    onChange={(val) => setSelectedActionId(val)}
                    placeholder="Select action template..."
                  />

                  {/* 3-Way Action Binding Status Widget */}
                  {selectedActionId && (
                    <div className="p-3 rounded-apple-md bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          ✓ 3-Way Action Binding Status
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          1 User • 1 Role • 1 Button
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                          <div className="text-zinc-400 text-[10px]">User Select</div>
                          <div
                            className={
                              selectMenu?.type === ComponentType.USER_SELECT ||
                              currentActionUsage?.userSelect
                                ? 'text-emerald-400 font-semibold'
                                : 'text-zinc-500'
                            }
                          >
                            {selectMenu?.type === ComponentType.USER_SELECT
                              ? '✓ This Menu'
                              : currentActionUsage?.userSelect
                              ? '✓ Mapped'
                              : '○ Not Mapped'}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                          <div className="text-zinc-400 text-[10px]">Role Select</div>
                          <div
                            className={
                              selectMenu?.type === ComponentType.ROLE_SELECT ||
                              currentActionUsage?.roleSelect
                                ? 'text-emerald-400 font-semibold'
                                : 'text-zinc-500'
                            }
                          >
                            {selectMenu?.type === ComponentType.ROLE_SELECT
                              ? '✓ This Menu'
                              : currentActionUsage?.roleSelect
                              ? '✓ Mapped'
                              : '○ Not Mapped'}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                          <div className="text-zinc-400 text-[10px]">Action Button</div>
                          <div
                            className={
                              currentActionUsage?.button
                                ? 'text-emerald-400 font-semibold'
                                : 'text-amber-400 font-semibold'
                            }
                          >
                            {currentActionUsage?.button
                              ? `✓ ${currentActionUsage.buttonLabel || 'Mapped'}`
                              : '○ Not Mapped'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <TextInput
                  label="Custom ID"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="e.g. rng_user_select"
                />
              )}

              <TextInput
                label="Placeholder Text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder={
                  selectMenu?.type === ComponentType.USER_SELECT
                    ? 'Select a user...'
                    : 'Select a role...'
                }
              />
            </div>
          )}

          {/* Type 3 String Select Custom ID & Placeholder */}
          {isType3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Menu Custom ID"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="rng_sel_ministry"
              />
              <TextInput
                label="Placeholder Text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Choose an option..."
              />
            </div>
          )}

          {/* Disabled State */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-zinc-300">Disabled State</span>
            <ToggleSwitch checked={disabled} onChange={setDisabled} />
          </div>

          {/* Action Invoker Button Binding for String Select */}
          {isType3 && (
            <div className="p-3.5 rounded-apple-lg bg-surface-card border border-white/10 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <MousePointerClick size={14} className="text-amber-400" />
                <span className="text-xs font-semibold text-white">
                  Action Invoker Button Binding
                </span>
              </div>

              {mappedButton ? (
                <div className="p-2.5 rounded-apple-md bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">🔘</span>
                    <span className="text-xs font-medium text-white truncate">
                      {mappedButton.button.label || 'Action Button'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setTempSelectedButton(mappedButton);
                        setIsButtonPickerOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-apple-sm text-[11px] font-medium bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setMappedButton(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-apple-sm text-[11px] font-medium bg-red-500/15 hover:bg-red-500/25 text-red-300 transition-colors cursor-pointer"
                    >
                      <Unlink size={11} />
                      <span>Unlink</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-apple-md bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400">No button currently mapped as invoker.</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<MousePointerClick size={12} />}
                    onClick={() => {
                      setTempSelectedButton(null);
                      setIsButtonPickerOpen(true);
                    }}
                  >
                    Map Button
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Type 3 Select Options Management */}
          {isType3 && (
            <>
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Options ({options.length}/25)
                </label>
                {options.length < 25 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-apple-sm bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {options.map((opt, idx) => (
                  <div
                    key={`opt_${idx}`}
                    className="p-3 rounded-apple-md bg-black/40 border border-white/[0.08] flex flex-col gap-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <TextInput
                        label={`Option #${idx + 1} Label`}
                        value={opt.label}
                        onChange={(e) => handleUpdateOption(idx, { label: e.target.value })}
                        placeholder="Option Label"
                      />
                      <TextInput
                        label="Value / Action ID"
                        value={opt.value}
                        onChange={(e) => handleUpdateOption(idx, { value: e.target.value })}
                        placeholder="opt_value or rng_act_..."
                      />
                      <div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-300">Emoji</label>
                          <div className="flex items-center gap-2">
                            {opt.emoji ? (
                              <div className="flex-1 h-[38px] px-3 rounded-apple-md bg-[#0E0E12] border border-surface-border hover:border-white/20 transition-all flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onOpenEmojiPicker) {
                                      onOpenEmojiPicker((token) => handleUpdateOption(idx, { emoji: token }));
                                    }
                                  }}
                                  className="flex items-center flex-1 h-full cursor-pointer text-left overflow-hidden"
                                  title="Change Emoji"
                                  aria-label="Change Emoji"
                                >
                                  <DiscordEmoji emoji={opt.emoji} className="w-5 h-5 object-contain shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOption(idx, { emoji: undefined })}
                                  className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
                                  title="Clear Emoji"
                                  aria-label="Clear Emoji"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <TextInput
                                value=""
                                onChange={(e) => handleUpdateOption(idx, { emoji: e.target.value })}
                                placeholder=""
                                className="flex-1"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenEmojiPicker) {
                                  onOpenEmojiPicker((token) => handleUpdateOption(idx, { emoji: token }));
                                }
                              }}
                              className="h-[38px] px-3 rounded-apple-md border flex items-center justify-center transition-all cursor-pointer bg-[#0E0E12] border-surface-border hover:border-white/20 text-zinc-300 hover:text-brand-red shrink-0"
                              title="Pick Discord Emoji"
                              aria-label="Pick Discord Emoji"
                            >
                              <Smile size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <TextInput
                          label="Description (Optional)"
                          value={opt.description ?? ''}
                          onChange={(e) =>
                            handleUpdateOption(idx, { description: e.target.value })
                          }
                          placeholder="Brief option description..."
                        />
                      </div>
                      {options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          aria-label={`Remove option ${idx + 1}`}
                          className="p-2 mt-5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                          title="Delete Option"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <Dropdown
                      label="Bind Option to Action Template"
                      options={hasActionTemplates ? actionOptions : []}
                      value={hasActionTemplates && actionOptions.some((optAction) => optAction.value === opt.value) ? opt.value : ''}
                      onChange={(val) => handleUpdateOption(idx, { value: val })}
                      placeholder={
                        hasActionTemplates
                          ? 'Select action template...'
                          : 'No action templates found (create in Action Templates tab)'
                      }
                      disabled={!hasActionTemplates}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Button Picker Modal */}
      {isButtonPickerOpen && (
        <Modal
          isOpen={isButtonPickerOpen}
          onClose={() => setIsButtonPickerOpen(false)}
          title="Select Invoker Button"
          description="Choose a button from your message canvas to trigger this menu."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsButtonPickerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!tempSelectedButton}
                onClick={() => {
                  setMappedButton(tempSelectedButton);
                  setIsButtonPickerOpen(false);
                }}
              >
                Confirm Button Selection
              </Button>
            </div>
          }
        >
          {allButtons.length === 0 ? (
            <div className="p-6 text-center rounded-apple-lg bg-black/40 border border-white/10 text-zinc-400 flex flex-col items-center gap-2">
              <AlertCircle size={24} className="text-amber-400" />
              <span className="text-xs font-semibold text-white">
                No buttons found in this message
              </span>
              <p className="text-[11px] text-zinc-400 max-w-sm">
                Add an Action Row containing at least 1 Button to your message canvas first, then return here to map it.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {allButtons.map((btnRef, idx) => {
                const isSelected =
                  tempSelectedButton?.button.id === btnRef.button.id ||
                  (tempSelectedButton?.cIdx === btnRef.cIdx &&
                    tempSelectedButton?.rowId === btnRef.rowId &&
                    tempSelectedButton?.btnIdx === btnRef.btnIdx);

                const styleInfo = getButtonStyleInfo(btnRef.button.style);

                return (
                  <div
                    key={`btn_opt_${idx}`}
                    onClick={() => setTempSelectedButton(btnRef)}
                    className={`p-3 rounded-apple-md border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`px-2.5 py-1 rounded text-xs font-semibold text-white shrink-0 ${styleInfo.bg}`}
                      >
                        {btnRef.button.label || 'Button'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-semibold text-zinc-300">
                          Container {btnRef.cIdx + 1} • {styleInfo.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono truncate">
                          ID: {btnRef.button.custom_id || btnRef.button.id || 'btn'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-black'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </>
  );
};
