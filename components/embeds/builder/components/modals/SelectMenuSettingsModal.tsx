"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  DiscordSelectComponent,
  SelectOption,
  PartialEmojiObject,
  EmbedAction,
  Type17Container,
  DiscordButtonComponent
} from '../../../types';
import { DiscordEmojiPicker } from '../../../DiscordEmojiPicker';
import { EmojiItem } from '../../../emoji-data';
import { renderDiscordEmoji } from '../../../DiscordEmojiRenderer';
import { GlassmorphicDropdown } from '@/components/ui/GlassmorphicDropdown';
import { api } from '@/lib/api';

interface SelectMenuSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comp: DiscordSelectComponent;
  onSave: (updated: DiscordSelectComponent) => void;
  availableActions?: EmbedAction[];
  allContainers?: Type17Container[];
  onUpdateContainers?: (updated: Type17Container[]) => void;
  serverId?: string;
}

function parseEmoji(emojiStr: string): string | PartialEmojiObject | undefined {
  const trimmed = emojiStr.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/);
  if (match) {
    return {
      animated: match[1] === 'a',
      name: match[2],
      id: match[3]
    };
  }
  return trimmed;
}

function formatEmoji(emoji?: string | PartialEmojiObject): string {
  if (!emoji) return '';
  if (typeof emoji === 'string') return emoji;
  if (emoji.id) {
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
  }
  return emoji.name || '';
}

interface ButtonItemRef {
  cIdx: number;
  rowId?: string;
  btnIdx: number;
  button: DiscordButtonComponent;
}

export function SelectMenuSettingsModal({
  isOpen,
  onClose,
  comp,
  onSave,
  availableActions,
  allContainers = [],
  onUpdateContainers,
  serverId
}: SelectMenuSettingsModalProps) {
  const [customId, setCustomId] = useState(comp.custom_id || comp.id || '');
  const [placeholder, setPlaceholder] = useState(comp.placeholder || '');
  const [disabled, setDisabled] = useState<boolean>(Boolean(comp.disabled));
  const [fetchedActions, setFetchedActions] = useState<EmbedAction[]>([]);

  // Collect all buttons across all containers
  const allButtons = useMemo<ButtonItemRef[]>(() => {
    const list: ButtonItemRef[] = [];
    allContainers.forEach((c, cIdx) => {
      (c.components || []).forEach((inner) => {
        if (inner.type === 1 && inner.items) {
          inner.items.forEach((item, btnIdx) => {
            if (item.type === 2) {
              list.push({
                cIdx,
                rowId: inner.id,
                btnIdx,
                button: item
              });
            }
          });
        }
      });
    });
    return list;
  }, [allContainers]);

  // Determine currently mapped invoker button for this string select
  const currentInvokerCustomId = `rng_btn_invoke_${comp.custom_id || comp.id}`;
  const initialMappedButton = useMemo(() => {
    return allButtons.find(
      (b) =>
        b.button.custom_id === currentInvokerCustomId ||
        (comp as any).invokerButtonId === b.button.id ||
        (comp as any).invokerButtonId === b.button.custom_id
    ) || null;
  }, [allButtons, currentInvokerCustomId, comp]);

  const [mappedButton, setMappedButton] = useState<ButtonItemRef | null>(initialMappedButton);
  const [isButtonPickerOpen, setIsButtonPickerOpen] = useState(false);
  const [tempSelectedButton, setTempSelectedButton] = useState<ButtonItemRef | null>(initialMappedButton);

  // Type 5 / 6 action binding mode
  const initialActionId = (comp as any).actionId ||
    (comp.custom_id?.startsWith('rng_sel_user_') ? comp.custom_id.replace('rng_sel_user_', '') : undefined) ||
    (comp.custom_id?.startsWith('rng_sel_role_') ? comp.custom_id.replace('rng_sel_role_', '') : undefined) ||
    '';

  const [actionSourceMode, setActionSourceMode] = useState<'template' | 'custom'>(
    initialActionId || comp.custom_id?.startsWith('rng_sel_') ? 'template' : 'custom'
  );
  const [selectedActionId, setSelectedActionId] = useState<string>(initialActionId);

  // Load actions
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const loaded: EmbedAction[] = [];
        if (serverId && serverId !== 'default') {
          try {
            const serverRes = await api.fetchServerActions(serverId);
            if (serverRes.success && serverRes.data) {
              const list = Array.isArray(serverRes.data) ? serverRes.data : ((serverRes.data as any).content || []);
              loaded.push(...list);
            }
          } catch {}
        }
        try {
          const res = await api.fetchActionTemplates();
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : ((res.data as any).content || []);
            loaded.push(...list);
          }
        } catch {}

        const map = new Map<string, EmbedAction>();
        loaded.forEach((a) => {
          if (a.actionId) map.set(a.actionId, a);
        });
        if (isMounted) {
          setFetchedActions(Array.from(map.values()));
        }
      } catch {}
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const actionsList = useMemo(() => {
    if (fetchedActions.length > 0) return fetchedActions;
    return availableActions || [];
  }, [availableActions, fetchedActions]);

  // Scan allContainers to check 1-of-each usage across User Select, Role Select, and Button
  const actionUsages = useMemo(() => {
    const usages = new Map<string, { userSelect?: string; roleSelect?: string; button?: string; buttonLabel?: string }>();
    allContainers.forEach((c) => {
      (c.components || []).forEach((inner) => {
        if (inner.type === 5) {
          const aId = (inner as any).actionId ||
            (inner.custom_id?.startsWith('rng_sel_user_') ? inner.custom_id.replace('rng_sel_user_', '') : undefined);
          if (aId) {
            const entry = usages.get(aId) || {};
            entry.userSelect = inner.id || inner.custom_id;
            usages.set(aId, entry);
          }
        } else if (inner.type === 6) {
          const aId = (inner as any).actionId ||
            (inner.custom_id?.startsWith('rng_sel_role_') ? inner.custom_id.replace('rng_sel_role_', '') : undefined);
          if (aId) {
            const entry = usages.get(aId) || {};
            entry.roleSelect = inner.id || inner.custom_id;
            usages.set(aId, entry);
          }
        } else if (inner.type === 1 && inner.items) {
          inner.items.forEach((item) => {
            if (item.type === 2 && item.custom_id?.startsWith('rng_act_')) {
              const entry = usages.get(item.custom_id) || {};
              entry.button = item.id || item.custom_id;
              entry.buttonLabel = item.label || 'Action Button';
              usages.set(item.custom_id, entry);
            }
          });
        }
      });
    });
    return usages;
  }, [allContainers]);

  const [options, setOptions] = useState<SelectOption[]>(
    comp.options && comp.options.length > 0
      ? comp.options.map((opt) => ({ ...opt }))
      : [
          {
            label: 'Option 1',
            value: 'opt_1',
            description: '',
            default: false
          }
        ]
  );

  // Emoji picker state
  const [activeEmojiIdx, setActiveEmojiIdx] = useState<number | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

  if (!isOpen) return null;

  const typeLabels: Record<number, string> = {
    3: 'String Select',
    5: 'User Select',
    6: 'Role Select',
    7: 'Mentionable Select',
    8: 'Channel Select'
  };

  const handleOpenEmojiPicker = (e: React.MouseEvent<HTMLButtonElement>, idx: number) => {
    setActiveEmojiIdx(idx);
    setEmojiTriggerRect(e.currentTarget.getBoundingClientRect());
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiSelect = (_emoji: EmojiItem, insertStr: string) => {
    if (activeEmojiIdx !== null && activeEmojiIdx >= 0 && activeEmojiIdx < options.length) {
      const next = [...options];
      next[activeEmojiIdx] = {
        ...next[activeEmojiIdx],
        emoji: parseEmoji(insertStr)
      };
      setOptions(next);
    }
    setIsEmojiPickerOpen(false);
    setActiveEmojiIdx(null);
  };

  const handleClearEmoji = (idx: number) => {
    const next = [...options];
    next[idx] = { ...next[idx], emoji: undefined };
    setOptions(next);
  };

  const handleUpdateOption = (idx: number, patch: Partial<SelectOption>) => {
    const next = [...options];
    next[idx] = { ...next[idx], ...patch };
    setOptions(next);
  };

  const handleAddOption = () => {
    if (options.length >= 25) return;
    const newIdx = options.length + 1;
    setOptions([
      ...options,
      {
        label: `Option ${newIdx}`,
        value: `opt_${Date.now()}_${newIdx}`,
        description: '',
        default: false
      }
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const finalCustomId =
      comp.type === 5 && actionSourceMode === 'template' && selectedActionId
        ? `rng_sel_user_${selectedActionId}`
        : comp.type === 6 && actionSourceMode === 'template' && selectedActionId
        ? `rng_sel_role_${selectedActionId}`
        : customId.trim() || comp.custom_id || `rng_sel_${Date.now()}`;

    // If String Select (Type 3) and invoker button mapping changed, update containers
    if (comp.type === 3 && onUpdateContainers && allContainers.length > 0) {
      const targetBtnInvokeId = `rng_btn_invoke_${finalCustomId}`;
      const updatedContainers = JSON.parse(JSON.stringify(allContainers)) as Type17Container[];

      // First, remove any old rng_btn_invoke_ for this select from other buttons
      updatedContainers.forEach((c) => {
        (c.components || []).forEach((inner) => {
          if (inner.type === 1 && inner.items) {
            inner.items.forEach((item) => {
              if (item.type === 2 && item.custom_id === targetBtnInvokeId) {
                item.custom_id = `btn_${Date.now()}`;
              }
            });
          }
        });
      });

      // If mapped button is selected, apply the targetBtnInvokeId
      if (mappedButton) {
        let applied = false;
        updatedContainers.forEach((c, cIdx) => {
          if (cIdx === mappedButton.cIdx) {
            (c.components || []).forEach((inner) => {
              if (inner.type === 1 && inner.items) {
                inner.items.forEach((item, btnIdx) => {
                  if (
                    item.type === 2 &&
                    (item.id === mappedButton.button.id ||
                      (inner.id === mappedButton.rowId && btnIdx === mappedButton.btnIdx))
                  ) {
                    item.custom_id = targetBtnInvokeId;
                    applied = true;
                  }
                });
              }
            });
          }
        });
        if (!applied) {
          // Fallback find by button id
          updatedContainers.forEach((c) => {
            (c.components || []).forEach((inner) => {
              if (inner.type === 1 && inner.items) {
                inner.items.forEach((item) => {
                  if (item.type === 2 && item.id === mappedButton.button.id) {
                    item.custom_id = targetBtnInvokeId;
                  }
                });
              }
            });
          });
        }
      }

      onUpdateContainers(updatedContainers);
    }

    const updated: DiscordSelectComponent = {
      ...comp,
      custom_id: finalCustomId,
      placeholder: placeholder.trim() || undefined,
      disabled,
      options: comp.type === 3 ? options : undefined
    };

    if (comp.type === 5 || comp.type === 6) {
      if (actionSourceMode === 'template' && selectedActionId) {
        (updated as any).actionId = selectedActionId;
      } else {
        (updated as any).actionId = undefined;
      }
    }

    if (comp.type === 3) {
      (updated as any).invokerButtonId = mappedButton?.button.id || mappedButton?.button.custom_id || undefined;
    }

    onSave(updated);
    onClose();
  };

  const currentActionUsage = selectedActionId ? actionUsages.get(selectedActionId) : undefined;

  return (
    <>
      <div
        className="modal-overlay open"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-dialog"
          style={{
            maxWidth: '680px',
            width: '100%',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 168, 252, 0.12)'
          }}
        >
          {/* Header */}
          <div className="modal-header">
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 168, 252, 0.15)', border: '1px solid rgba(0, 168, 252, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#38bdf8', fontSize: '14px' }} />
              </div>
              <span>Select Menu Settings</span>
              <span className="component-modal-badge cyan">Type {comp.type} • {typeLabels[comp.type] || 'Select'}</span>
            </div>
            <button className="btn-container-close" onClick={onClose} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px', overflowY: 'auto', maxHeight: '72vh' }}>

            {/* Type 5 (User Select) and Type 6 (Role Select) Action Template Binding */}
            {(comp.type === 5 || comp.type === 6) && (
              <div className="form-group p-3 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-link text-emerald-400 text-xs" />
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Action Template Binding</label>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActionSourceMode('template')}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                        actionSourceMode === 'template'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Action Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionSourceMode('custom')}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                        actionSourceMode === 'custom'
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Custom ID
                    </button>
                  </div>
                </div>

                <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                  Map this {comp.type === 5 ? 'User Select' : 'Role Select'} to an Action Template (e.g. <span className="text-zinc-200 font-semibold">Grant Role</span>). In Discord, selecting a {comp.type === 5 ? 'member' : 'role'} will store it in the active session for the mapped button to execute.
                </p>

                {actionSourceMode === 'template' ? (
                  <div className="space-y-2">
                    <GlassmorphicDropdown
                      options={[
                        {
                          value: '',
                          label: 'None (Unbound)',
                          description: 'Do not bind this select menu to an action template'
                        },
                        ...actionsList.map((act) => {
                          const usage = actionUsages.get(act.actionId);
                          const isAnotherUserSelect =
                            comp.type === 5 && usage?.userSelect && usage.userSelect !== comp.id && usage.userSelect !== comp.custom_id;
                          const isAnotherRoleSelect =
                            comp.type === 6 && usage?.roleSelect && usage.roleSelect !== comp.id && usage.roleSelect !== comp.custom_id;
                          const isBlocked = Boolean(isAnotherUserSelect || isAnotherRoleSelect);

                          return {
                            value: act.actionId,
                            label: act.name,
                            description: isBlocked
                              ? `⚠️ Already mapped to another ${comp.type === 5 ? 'User' : 'Role'} Select in this message`
                              : act.description || act.actionId,
                            badge: act.actionType,
                            disabled: isBlocked
                          };
                        })
                      ]}
                      value={selectedActionId}
                      onChange={(val) => setSelectedActionId(val)}
                      placeholder="Select Action Template..."
                      searchable
                    />

                    {/* 3-Way Pipeline Status Widget */}
                    {selectedActionId && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-nodes" /> 3-Way Action Binding Status
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">1 User • 1 Role • 1 Button</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                            <div className="text-zinc-400 text-[10px]">User Select</div>
                            <div className={comp.type === 5 || currentActionUsage?.userSelect ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                              {comp.type === 5 ? '✓ This Menu' : currentActionUsage?.userSelect ? '✓ Mapped' : '○ Not Mapped'}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                            <div className="text-zinc-400 text-[10px]">Role Select</div>
                            <div className={comp.type === 6 || currentActionUsage?.roleSelect ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                              {comp.type === 6 ? '✓ This Menu' : currentActionUsage?.roleSelect ? '✓ Mapped' : '○ Not Mapped'}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                            <div className="text-zinc-400 text-[10px]">Action Button</div>
                            <div className={currentActionUsage?.button ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                              {currentActionUsage?.button ? `✓ ${currentActionUsage.buttonLabel || 'Mapped'}` : '○ Not Mapped'}
                            </div>
                          </div>
                        </div>

                        {!currentActionUsage?.button && (
                          <p className="text-[10.5px] text-amber-300/90 leading-tight">
                            💡 Tip: Make sure to also add/map a Button with this same Action Template to execute this operation.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Custom ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. rng_user_select"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Custom ID & Placeholder (For String Select or fallback) */}
            {comp.type === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Custom ID (Required)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. rng_select_menu"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Placeholder Text</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Choose an option..."
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                  />
                </div>
              </div>
            )}

            {(comp.type === 5 || comp.type === 6) && actionSourceMode === 'template' && (
              <div className="form-group">
                <label className="form-label">Placeholder Text</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={comp.type === 5 ? 'Select a user...' : 'Select a role...'}
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </div>
            )}

            {/* Disabled State Toggle */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '36px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#dbdee1' }}>
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                />
                <span>Disabled State</span>
              </label>
            </div>

            {/* Options Management (Only for Type 3 String Select) */}
            {comp.type === 3 && (
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Select Options ({options.length}/25)
                  </label>
                  {options.length < 25 && (
                    <button
                      type="button"
                      className="btn-add-option-pill"
                      style={{ fontSize: '11px', padding: '3px 10px' }}
                      onClick={handleAddOption}
                    >
                      <i className="fa-solid fa-plus" /> Add Option
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {options.map((opt, optIdx) => {
                    const emojiStr = formatEmoji(opt.emoji);
                    const isActionBound = opt.value?.startsWith('rng_act_');
                    const matchedAction = actionsList.find((a) => a.actionId === opt.value);

                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          background: '#1e1f22',
                          padding: '10px',
                          borderRadius: '6px',
                          border: isActionBound ? '1px solid rgba(211, 52, 52, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Emoji Picker Button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn-open-picker-pill"
                              style={{
                                width: '36px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                padding: 0
                              }}
                              title="Pick Emoji"
                              onClick={(e) => handleOpenEmojiPicker(e, optIdx)}
                            >
                              {emojiStr ? renderDiscordEmoji(emojiStr, 18) : <i className="fa-regular fa-face-smile" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }} />}
                            </button>
                            {emojiStr && (
                              <button
                                type="button"
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px' }}
                                title="Clear Emoji"
                                onClick={() => handleClearEmoji(optIdx)}
                              >
                                <i className="fa-solid fa-xmark" style={{ fontSize: '10px' }} />
                              </button>
                            )}
                          </div>

                          {/* Option Label */}
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1, fontWeight: 600, fontSize: '12px' }}
                            placeholder="Option Label"
                            value={opt.label}
                            onChange={(e) => handleUpdateOption(optIdx, { label: e.target.value })}
                          />

                          {/* Option Value */}
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1, fontSize: '11.5px', color: isActionBound ? '#d33434' : 'var(--discord-cyan)' }}
                            placeholder="Option Value"
                            value={opt.value}
                            onChange={(e) => handleUpdateOption(optIdx, { value: e.target.value })}
                          />

                          {/* Action Template Quick Selector */}
                          {actionsList.length > 0 && (
                            <select
                              value={opt.value?.startsWith('rng_act_') ? opt.value : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  const chosen = actionsList.find((a) => a.actionId === e.target.value);
                                  handleUpdateOption(optIdx, {
                                    value: e.target.value,
                                    label: opt.label.startsWith('Option ') && chosen?.name ? chosen.name : opt.label
                                  });
                                }
                              }}
                              style={{
                                fontSize: '11px',
                                background: 'rgba(0,0,0,0.4)',
                                border: isActionBound ? '1px solid #d33434' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                color: isActionBound ? 'rgb(113, 252, 0)' : '#d4d4d4',
                                padding: '4px 6px',
                                maxWidth: '140px',
                                textOverflow: 'ellipsis'
                              }}
                              title="Bind option to an Action Template"
                            >
                              {actionsList.map((act) => (
                                <option key={act.actionId} value={act.actionId} style={{background: 'rgba(0,0,0,0.5)'}}>
                                {act.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Default Toggle */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: opt.default ? 'var(--discord-green)' : 'var(--discord-text-muted)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(opt.default)}
                              onChange={(e) => handleUpdateOption(optIdx, { default: e.target.checked })}
                            />
                            <span>Default</span>
                          </label>

                          {/* Delete Option */}
                          <button
                            type="button"
                            className="comp-tool-btn btn-del"
                            style={{ width: '26px', height: '26px', fontSize: '11px' }}
                            onClick={() => handleRemoveOption(optIdx)}
                            title={options.length <= 1 ? "At least 1 option required" : "Remove Option"}
                            disabled={options.length <= 1}
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>

                        {/* Option Description */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1, fontSize: '11px', color: 'var(--discord-text-muted)' }}
                            placeholder="Optional description subtext..."
                            value={opt.description || ''}
                            onChange={(e) => handleUpdateOption(optIdx, { description: e.target.value })}
                          />
                          {isActionBound && matchedAction && (
                            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 whitespace-nowrap">
                              ⚡ Bound: {matchedAction.name} ({matchedAction.actionType})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* String Select (Type 3) - Action Invoker Button Binding */}
            {comp.type === 3 && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-bolt text-amber-400 text-xs" />
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Action Invoker Button Binding</label>
                  </div>
                  {mappedButton ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTempSelectedButton(mappedButton);
                          setIsButtonPickerOpen(true);
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                      >
                        Change Button
                      </button>
                      <button
                        type="button"
                        onClick={() => setMappedButton(null)}
                        className="px-2 py-1 rounded text-[11px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all cursor-pointer"
                      >
                        Unlink
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempSelectedButton(null);
                        setIsButtonPickerOpen(true);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-hand-pointer text-[10px]" /> Map Button to String Select
                    </button>
                  )}
                </div>
                {mappedButton ? (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-black/60 border border-white/10 flex items-center justify-center text-sm">
                        {renderDiscordEmoji(formatEmoji(mappedButton.button.emoji), 16) || '🔘'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{mappedButton.button.label || 'Action Button'}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Invoker Button
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Container {mappedButton.cIdx + 1} • Button #{mappedButton.btnIdx + 1} • ID: {mappedButton.button.custom_id || mappedButton.button.id}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <i className="fa-solid fa-check" /> Active Mapping
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-400 flex items-center gap-2">
                    <i className="fa-solid fa-info-circle text-zinc-500" />
                    <span>No invoker button mapped. Options will execute immediately upon selection (or save to session).</span>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="modal-footer" style={{ padding: '14px 0 0 0', background: 'transparent' }}>
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn-save"
                onClick={handleSave}
              >
                <i className="fa-solid fa-check" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Button Picker Modal (for mapping string select to 1 button) */}
      {isButtonPickerOpen && (
        <div
          className="modal-overlay open"
          style={{ zIndex: 1000000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsButtonPickerOpen(false);
          }}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 35px rgba(251, 191, 36, 0.15)'
            }}
          >
            <div className="modal-header">
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-hand-pointer text-amber-400" />
                <span>Select Button to Map to String Select</span>
              </div>
              <button
                type="button"
                className="btn-container-close"
                onClick={() => setIsButtonPickerOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Click 1 button component from your message canvas below to bind it as the invoker for this String Select menu:
              </p>

              {allButtons.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-black/40 border border-white/10 text-zinc-400 space-y-2">
                  <i className="fa-solid fa-circle-exclamation text-amber-400 text-xl" />
                  <div className="text-xs font-semibold text-white">No buttons found in this message</div>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    Add an Action Row containing at least 1 Button to your message first, then return here to map it.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {allButtons.map((btnRef, idx) => {
                    const isSelected =
                      tempSelectedButton?.button.id === btnRef.button.id ||
                      (tempSelectedButton?.cIdx === btnRef.cIdx &&
                        tempSelectedButton?.rowId === btnRef.rowId &&
                        tempSelectedButton?.btnIdx === btnRef.btnIdx);

                    const styleColors: Record<number, string> = {
                      1: 'bg-[#5865F2] hover:bg-[#4752C4]',
                      2: 'bg-[#4E5058] hover:bg-[#404249]',
                      3: 'bg-[#23A55A] hover:bg-[#1B8246]',
                      4: 'bg-[#DA373C] hover:bg-[#B52B30]',
                      5: 'bg-[#4E5058] hover:bg-[#404249]'
                    };

                    const styleNames: Record<number, string> = {
                      1: 'Primary (Blurple)',
                      2: 'Secondary (Grey)',
                      3: 'Success (Green)',
                      4: 'Danger (Red)',
                      5: 'Link'
                    };

                    const emojiStr = formatEmoji(btnRef.button.emoji);

                    return (
                      <div
                        key={idx}
                        onClick={() => setTempSelectedButton(btnRef)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm pointer-events-none ${
                              styleColors[btnRef.button.style || 1] || styleColors[1]
                            }`}
                          >
                            {emojiStr && renderDiscordEmoji(emojiStr, 14)}
                            <span>{btnRef.button.label || 'Button'}</span>
                          </button>
                          <div>
                            <div className="text-[11px] font-semibold text-zinc-300">
                              Container {btnRef.cIdx + 1} • {styleNames[btnRef.button.style || 1] || 'Button'}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              ID: {btnRef.button.custom_id || btnRef.button.id || 'btn'}
                            </div>
                          </div>
                        </div>

                        <div className="w-5 h-5 rounded-full border flex items-center justify-center text-xs transition-all">
                          {isSelected ? (
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-black text-[9px]">
                              <i className="fa-solid fa-check" />
                            </span>
                          ) : (
                            <span className="border-white/20 w-3.5 h-3.5 rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', background: 'transparent' }}>
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setIsButtonPickerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!tempSelectedButton}
                className="modal-btn-save"
                style={{
                  background: tempSelectedButton ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                  color: tempSelectedButton ? '#000' : '#888',
                  cursor: tempSelectedButton ? 'pointer' : 'not-allowed'
                }}
                onClick={() => {
                  setMappedButton(tempSelectedButton);
                  setIsButtonPickerOpen(false);
                }}
              >
                <i className="fa-solid fa-check" />
                <span>Confirm Button Selection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <DiscordEmojiPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => {
            setIsEmojiPickerOpen(false);
            setActiveEmojiIdx(null);
          }}
          onSelect={handleEmojiSelect}
          triggerRect={emojiTriggerRect}
        />
      )}
    </>
  );
}
