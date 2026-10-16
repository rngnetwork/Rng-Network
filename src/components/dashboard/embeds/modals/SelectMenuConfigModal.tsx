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
} from 'lucide-react';
import {
  ComponentType,
  type DiscordStringSelectComponent,
  type DiscordSelectOption,
  type DiscordButtonComponent,
  type DiscordActionRowComponent,
  type Type17Container,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';

export interface SelectMenuConfigModalProps {
  isOpen: boolean;
  selectMenu: DiscordStringSelectComponent | null;
  availableActions?: EmbedAction[];
  allContainers?: Type17Container[];
  onUpdateContainers?: (updated: Type17Container[]) => void;
  onClose: () => void;
  onSave: (updated: DiscordStringSelectComponent) => void;
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
  onClose,
  onSave,
}) => {
  const [prevSelectMenu, setPrevSelectMenu] = useState(selectMenu);
  const [customId, setCustomId] = useState(
    selectMenu?.custom_id ?? 'rng_sel_default'
  );
  const [placeholder, setPlaceholder] = useState(
    selectMenu?.placeholder ?? 'Select an option...'
  );
  const [options, setOptions] = useState<DiscordSelectOption[]>(
    selectMenu?.options ?? [
      { label: 'Option 1', value: 'opt_1', description: '' },
    ]
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

  // Determine currently mapped invoker button
  const currentInvokerCustomId = `rng_btn_invoke_${selectMenu?.custom_id || selectMenu?.id}`;
  const initialMappedButton = useMemo(() => {
    if (!selectMenu) return null;
    return (
      allButtons.find(
        (b) =>
          b.button.custom_id === currentInvokerCustomId ||
          selectMenu.invokerButtonId === b.button.id ||
          selectMenu.invokerButtonId === b.button.custom_id ||
          (b.button.custom_id &&
            b.button.custom_id.startsWith(`rng_btn_invoke_${selectMenu.custom_id}`))
      ) || (allButtons.length === 1 ? allButtons[0] : null)
    );
  }, [allButtons, currentInvokerCustomId, selectMenu]);

  const [mappedButton, setMappedButton] = useState<ButtonItemRef | null>(initialMappedButton);
  const [isButtonPickerOpen, setIsButtonPickerOpen] = useState(false);
  const [tempSelectedButton, setTempSelectedButton] = useState<ButtonItemRef | null>(initialMappedButton);

  if (selectMenu !== prevSelectMenu) {
    setPrevSelectMenu(selectMenu);
    setCustomId(selectMenu?.custom_id || 'rng_sel_default');
    setPlaceholder(selectMenu?.placeholder ?? 'Select an option...');
    setOptions(
      selectMenu && selectMenu.options.length > 0
        ? selectMenu.options
        : [{ label: 'Option 1', value: 'opt_1', description: '' }]
    );
    setMappedButton(initialMappedButton);
    setTempSelectedButton(initialMappedButton);
  }

  const actionOptions: DropdownOption<string>[] = availableActions.map(
    (act) => ({
      label: `${act.name} (${act.actionId})`,
      value: act.actionId,
    })
  );

  const handleUpdateOption = (
    idx: number,
    updates: Partial<DiscordSelectOption>
  ) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, ...updates } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 25) return;
    setOptions((prev) => [
      ...prev,
      {
        label: `Option ${prev.length + 1}`,
        value: `opt_${prev.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!selectMenu || !customId.trim() || options.length === 0) return;
    const finalCustomId = customId.trim();
    const targetBtnInvokeId = mappedButton
      ? `rng_btn_invoke_${finalCustomId}`
      : undefined;

    if (onUpdateContainers && allContainers.length > 0) {
      const invokeId = targetBtnInvokeId || `rng_btn_invoke_${finalCustomId}`;
      const updatedContainers = JSON.parse(
        JSON.stringify(allContainers)
      ) as Type17Container[];

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
                      (inner.id === mappedButton.rowId &&
                        btnIdx === mappedButton.btnIdx))
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
                  if (
                    item.type === ComponentType.BUTTON &&
                    item.id === mappedButton.button.id
                  ) {
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

    onSave({
      ...selectMenu,
      custom_id: finalCustomId,
      placeholder: placeholder.trim(),
      options,
      invokerButtonId: targetBtnInvokeId,
    });
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Configure String Select Menu (Type 3)"
        description="Configure dropdown placeholder, bind option values to Action Registry IDs, and link an Invoker Button."
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
              disabled={!customId.trim() || options.length === 0}
              onClick={handleSave}
            >
              Save Select Menu
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
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
              placeholder="Choose a division..."
            />
          </div>

          {/* Action Invoker Button Binding */}
          <div className="p-3.5 rounded-apple-lg bg-zinc-900/80 border border-white/[0.08] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointerClick size={15} className="text-amber-400" />
                <span className="text-xs font-semibold text-white">
                  Action Invoker Button Binding
                </span>
              </div>
              {mappedButton && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTempSelectedButton(mappedButton);
                      setIsButtonPickerOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-apple-sm text-[11px] font-medium bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors"
                  >
                    Change Button
                  </button>
                  <button
                    type="button"
                    onClick={() => setMappedButton(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-apple-sm text-[11px] font-medium bg-red-500/15 hover:bg-red-500/25 text-red-300 transition-colors"
                  >
                    <Unlink size={11} />
                    <span>Unlink</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              When an option is selected in Discord, the interaction does not execute immediately. It is stored in session and triggers once this explicitly mapped button is clicked.
            </p>

            {mappedButton ? (
              <div className="p-2.5 rounded-apple-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-black/60 border border-white/10 flex items-center justify-center text-sm shrink-0">
                    🔘
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {mappedButton.button.label || 'Action Button'}
                      </span>
                      <Badge variant="warning" size="sm">
                        Invoker Button
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 truncate">
                      Container {mappedButton.cIdx + 1} • Button #{mappedButton.btnIdx + 1} • ID: {mappedButton.button.custom_id || mappedButton.button.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium shrink-0 ml-2">
                  <Check size={13} />
                  <span>Active Mapping</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-apple-md bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <HelpCircle size={14} className="text-zinc-500 shrink-0" />
                  <span>No button currently mapped as invoker.</span>
                </div>
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

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-mono font-semibold uppercase text-zinc-300">
              Select Options ({options.length}/25)
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={options.length >= 25}
              leftIcon={<Plus size={13} />}
              onClick={handleAddOption}
            >
              Add Option
            </Button>
          </div>

          <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
            {options.map((opt, idx) => (
              <div
                key={`opt_${idx}`}
                className="p-3 rounded-apple-md bg-black/40 border border-white/[0.08] flex flex-col gap-2.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <TextInput
                    label={`Option #${idx + 1} Label`}
                    value={opt.label}
                    onChange={(e) =>
                      handleUpdateOption(idx, { label: e.target.value })
                    }
                  />
                  <TextInput
                    label="Value / Action ID (rng_act_*)"
                    value={opt.value}
                    onChange={(e) =>
                      handleUpdateOption(idx, { value: e.target.value })
                    }
                  />
                </div>

                {actionOptions.length > 0 && (
                  <Dropdown
                    label="Or Bind Option to Action Template"
                    options={actionOptions}
                    value={opt.value}
                    onChange={(val) => handleUpdateOption(idx, { value: val })}
                    placeholder="Select action template..."
                  />
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <TextInput
                      label="Description (Optional)"
                      value={opt.description ?? ''}
                      onChange={(e) =>
                        handleUpdateOption(idx, { description: e.target.value })
                      }
                    />
                  </div>
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      aria-label={`Remove option ${idx + 1}`}
                      className="p-2 mb-0.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Button Picker Modal */}
      {isButtonPickerOpen && (
        <Modal
          isOpen={isButtonPickerOpen}
          onClose={() => setIsButtonPickerOpen(false)}
          title="Select Button to Map as Invoker"
          description="Click 1 button component from your message canvas below to bind it as the invoker for this String Select menu:"
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
