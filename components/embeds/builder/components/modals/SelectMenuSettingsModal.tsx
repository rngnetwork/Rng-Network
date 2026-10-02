"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  DiscordSelectComponent,
  SelectOption,
  PartialEmojiObject,
  ComponentActionPayload,
  ComponentActionType,
  RoleActionSubtype,
  GuildRoleOption
} from '../../../types';
import { DiscordEmojiPicker } from '../../../DiscordEmojiPicker';
import { EmojiItem } from '../../../emoji-data';
import { GlassmorphicDropdown, DropdownOption } from '@/components/ui/GlassmorphicDropdown';
import { api } from '@/lib/api';

interface SelectMenuSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comp: DiscordSelectComponent;
  onSave: (updated: DiscordSelectComponent) => void;
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

function generateOptionId(idx: number): string {
  return `opt_${Date.now()}_${idx + 1}`;
}

function generateActionId(): string {
  return `rng_act_${Date.now().toString(16)}${Math.random().toString(16).substring(2, 6)}`;
}

function generateCustomId(): string {
  return `select_${Date.now()}`;
}

export function SelectMenuSettingsModal({
  isOpen,
  onClose,
  comp,
  onSave,
  serverId
}: SelectMenuSettingsModalProps) {
  const [customId, setCustomId] = useState(comp.custom_id || comp.id || '');
  const [placeholder, setPlaceholder] = useState(comp.placeholder || '');
  const [disabled, setDisabled] = useState<boolean>(Boolean(comp.disabled));
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

  // Per-Option Action Drawer State
  const [expandedActionOptIdx, setExpandedActionOptIdx] = useState<number | null>(null);

  // Live Server Roles Discovery
  const [roles, setRoles] = useState<GuildRoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(Boolean(serverId));

  useEffect(() => {
    let isMounted = true;
    if (!serverId) return;

    void (async () => {
      try {
        const res = await api.fetchServerRoles(serverId);
        if (isMounted && res.success && res.data) {
          setRoles(res.data);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load server roles for select customizer:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const roleOptions: DropdownOption<string>[] = useMemo(() => {
    return roles.map((r) => ({
      value: r.id,
      label: `@${r.name}`,
      badge: !r.assignableByBot ? 'Higher than Bot' : undefined,
      disabled: !r.assignableByBot,
      icon: (
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: r.color && r.color !== '#000000' ? r.color : '#99aab5',
            display: 'inline-block',
            marginRight: 6
          }}
        />
      )
    }));
  }, [roles]);

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

  const handleSetOptionActionType = (idx: number, type: ComponentActionType) => {
    const next = [...options];
    const opt = next[idx];

    if (type === 'NONE') {
      opt.action = undefined;
      if (opt.value.startsWith('rng_act_')) {
        opt.value = generateOptionId(idx);
      }
    } else {
      const existingActionId = opt.action?.actionId ||
        (opt.value.startsWith('rng_act_') ? opt.value : undefined);
      const actionId = existingActionId || generateActionId();
      opt.value = actionId;

      opt.action = {
        actionId,
        name: `${opt.label || 'Option'} - ${type}`,
        actionType: type,
        roleConfig: type === 'ROLE' ? (opt.action?.roleConfig || {
          subtype: 'TOGGLE',
          roleId: ''
        }) : undefined,
        replyConfig: type === 'REPLY' ? (opt.action?.replyConfig || {
          ephemeral: true,
          content: ''
        }) : undefined,
        ticketConfig: type === 'TICKET' ? (opt.action?.ticketConfig || {
          channelPrefix: 'ticket-',
          supportRoleIds: []
        }) : undefined,
        dmConfig: type === 'DM' ? (opt.action?.dmConfig || {
          content: ''
        }) : undefined
      };
    }

    setOptions(next);
  };

  const handleUpdateOptionAction = (idx: number, patch: Partial<ComponentActionPayload>) => {
    const next = [...options];
    const opt = next[idx];
    if (!opt.action) return;
    opt.action = {
      ...opt.action,
      ...patch
    };
    setOptions(next);
  };

  const handleAddOption = () => {
    if (options.length >= 25) return;
    const newIdx = options.length + 1;
    setOptions([
      ...options,
      {
        label: `Option ${newIdx}`,
        value: generateOptionId(newIdx - 1),
        description: '',
        default: false
      }
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== idx));
    if (expandedActionOptIdx === idx) {
      setExpandedActionOptIdx(null);
    } else if (expandedActionOptIdx !== null && expandedActionOptIdx > idx) {
      setExpandedActionOptIdx(expandedActionOptIdx - 1);
    }
  };

  const handleSave = () => {
    // Asynchronously register configured actions in backend registry
    for (const opt of options) {
      if (opt.action && opt.action.actionType !== 'NONE') {
        api.saveServerAction(opt.action, undefined, serverId).catch((err) => {
          console.warn('Failed to save select option action:', err);
        });
      }
    }

    const updated: DiscordSelectComponent = {
      ...comp,
      custom_id: customId.trim() || comp.custom_id || generateCustomId(),
      placeholder: placeholder.trim() || undefined,
      disabled,
      options: comp.type === 3 ? options : undefined
    };
    onSave(updated);
    onClose();
  };

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
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
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
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
            {/* Row 1: Custom ID & Placeholder */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Custom ID (Required)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. select_role_menu"
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                  {options.map((opt, optIdx) => {
                    const emojiStr = formatEmoji(opt.emoji);
                    const isDrawerOpen = expandedActionOptIdx === optIdx;
                    const hasAction = opt.action && opt.action.actionType !== 'NONE';

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
                          border: isDrawerOpen
                            ? '1px solid rgba(56, 189, 248, 0.4)'
                            : hasAction
                            ? '1px solid rgba(56, 189, 248, 0.2)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'border-color 0.15s ease'
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
                              {emojiStr ? emojiStr : <i className="fa-regular fa-face-smile" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }} />}
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
                            style={{
                              flex: 1,
                              fontSize: '11.5px',
                              color: hasAction ? '#38bdf8' : 'var(--discord-cyan)',
                              fontFamily: hasAction ? 'var(--font-mono)' : 'inherit'
                            }}
                            placeholder="Option Value"
                            value={opt.value}
                            readOnly={Boolean(hasAction)}
                            title={hasAction ? "Managed by Action Registry" : "Option Value"}
                            onChange={(e) => handleUpdateOption(optIdx, { value: e.target.value })}
                          />

                          {/* Action Pill Button */}
                          <button
                            type="button"
                            onClick={() => setExpandedActionOptIdx(isDrawerOpen ? null : optIdx)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: hasAction ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                              border: hasAction ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                              color: hasAction ? '#38bdf8' : '#949ba4',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                            title="Configure Interactive Action"
                          >
                            <i className={hasAction ? 'fa-solid fa-bolt' : 'fa-regular fa-circle-dot'} style={{ fontSize: '10px' }} />
                            <span>{hasAction ? (opt.action?.actionType || 'Action') : 'Action'}</span>
                            <i className={`fa-solid ${isDrawerOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '9px', marginLeft: '2px' }} />
                          </button>

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
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}
                          placeholder="Optional description subtext..."
                          value={opt.description || ''}
                          onChange={(e) => handleUpdateOption(optIdx, { description: e.target.value })}
                        />

                        {/* Inline Expandable Action Configuration Drawer */}
                        {isDrawerOpen && (
                          <div
                            style={{
                              marginTop: '6px',
                              padding: '10px',
                              borderRadius: '6px',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className="fa-solid fa-bolt" /> Option Action Handler
                              </span>
                              <span style={{ fontSize: '10px', color: '#949ba4', fontFamily: 'var(--font-mono)' }}>
                                {opt.value}
                              </span>
                            </div>

                            {/* Action Type Selector */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '5px' }}>
                              {[
                                { type: 'NONE', label: 'None', icon: 'fa-ban' },
                                { type: 'ROLE', label: 'Role Assign', icon: 'fa-shield-halved' },
                                { type: 'REPLY', label: 'Bot Reply', icon: 'fa-comment-dots' },
                                { type: 'TICKET', label: 'Ticket', icon: 'fa-ticket' },
                                { type: 'DM', label: 'Direct Msg', icon: 'fa-envelope' }
                              ].map((item) => {
                                const currentType = opt.action?.actionType || 'NONE';
                                const active = currentType === item.type;
                                return (
                                  <button
                                    key={item.type}
                                    type="button"
                                    onClick={() => handleSetOptionActionType(optIdx, item.type as ComponentActionType)}
                                    style={{
                                      padding: '5px 4px',
                                      borderRadius: '4px',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px',
                                      background: active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                      border: active ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                                      color: active ? '#38bdf8' : '#dbdee1'
                                    }}
                                  >
                                    <i className={`fa-solid ${item.icon}`} style={{ fontSize: '9px' }} />
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Sub-form: ROLE */}
                            {opt.action?.actionType === 'ROLE' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', color: '#dbdee1', flex: 1 }}>Subtype</span>
                                  {(['TOGGLE', 'ADD', 'REMOVE'] as RoleActionSubtype[]).map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => handleUpdateOptionAction(optIdx, {
                                        roleConfig: {
                                          ...(opt.action?.roleConfig || { roleId: '' }),
                                          subtype: st
                                        }
                                      })}
                                      style={{
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: opt.action?.roleConfig?.subtype === st ? '#5865F2' : 'rgba(255, 255, 255, 0.06)',
                                        border: opt.action?.roleConfig?.subtype === st ? '1px solid #7983f5' : '1px solid rgba(255, 255, 255, 0.1)',
                                        color: opt.action?.roleConfig?.subtype === st ? '#fff' : '#949ba4'
                                      }}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                  <label className="form-label" style={{ fontSize: '11px' }}>Target Role</label>
                                  {roleOptions.length > 0 ? (
                                    <GlassmorphicDropdown
                                      options={roleOptions}
                                      value={opt.action.roleConfig?.roleId || ''}
                                      onChange={(val) => {
                                        const selectedRole = roles.find((r) => r.id === val);
                                        handleUpdateOptionAction(optIdx, {
                                          roleConfig: {
                                            subtype: opt.action?.roleConfig?.subtype || 'TOGGLE',
                                            roleId: val,
                                            roleName: selectedRole?.name,
                                            successMessage: opt.action?.roleConfig?.successMessage,
                                            removeMessage: opt.action?.roleConfig?.removeMessage
                                          }
                                        });
                                      }}
                                      placeholder="Select Discord Role..."
                                      searchable
                                      searchPlaceholder="Search roles..."
                                      size="sm"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ fontSize: '11.5px' }}
                                      placeholder={isLoadingRoles ? "Loading roles..." : "Enter Role Snowflake ID"}
                                      value={opt.action.roleConfig?.roleId || ''}
                                      onChange={(e) => handleUpdateOptionAction(optIdx, {
                                        roleConfig: {
                                          subtype: opt.action?.roleConfig?.subtype || 'TOGGLE',
                                          roleId: e.target.value
                                        }
                                      })}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Sub-form: REPLY */}
                            {opt.action?.actionType === 'REPLY' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', color: '#dbdee1' }}>Reply Content</span>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#dbdee1', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(opt.action.replyConfig?.ephemeral ?? true)}
                                      onChange={(e) => handleUpdateOptionAction(optIdx, {
                                        replyConfig: {
                                          content: opt.action?.replyConfig?.content || '',
                                          ephemeral: e.target.checked
                                        }
                                      })}
                                      style={{ accentColor: '#38bdf8' }}
                                    />
                                    <span>Ephemeral</span>
                                  </label>
                                </div>
                                <textarea
                                  className="form-input"
                                  rows={2}
                                  style={{ fontSize: '11.5px', resize: 'vertical' }}
                                  placeholder="Response markdown message..."
                                  value={opt.action.replyConfig?.content || ''}
                                  onChange={(e) => handleUpdateOptionAction(optIdx, {
                                    replyConfig: {
                                      ephemeral: opt.action?.replyConfig?.ephemeral ?? true,
                                      content: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            )}

                            {/* Sub-form: TICKET */}
                            {opt.action?.actionType === 'TICKET' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ fontSize: '11.5px' }}
                                  placeholder="Channel prefix (default: ticket-)"
                                  value={opt.action.ticketConfig?.channelPrefix || ''}
                                  onChange={(e) => handleUpdateOptionAction(optIdx, {
                                    ticketConfig: {
                                      channelPrefix: e.target.value || 'ticket-',
                                      supportRoleIds: opt.action?.ticketConfig?.supportRoleIds || [],
                                      welcomeMessage: opt.action?.ticketConfig?.welcomeMessage
                                    }
                                  })}
                                />
                                <textarea
                                  className="form-input"
                                  rows={2}
                                  style={{ fontSize: '11.5px', resize: 'vertical' }}
                                  placeholder="Welcome message in created ticket channel..."
                                  value={opt.action.ticketConfig?.welcomeMessage || ''}
                                  onChange={(e) => handleUpdateOptionAction(optIdx, {
                                    ticketConfig: {
                                      channelPrefix: opt.action?.ticketConfig?.channelPrefix || 'ticket-',
                                      supportRoleIds: opt.action?.ticketConfig?.supportRoleIds || [],
                                      welcomeMessage: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            )}

                            {/* Sub-form: DM */}
                            {opt.action?.actionType === 'DM' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <textarea
                                  className="form-input"
                                  rows={2}
                                  style={{ fontSize: '11.5px', resize: 'vertical' }}
                                  placeholder="Direct message sent to user..."
                                  value={opt.action.dmConfig?.content || ''}
                                  onChange={(e) => handleUpdateOptionAction(optIdx, {
                                    dmConfig: {
                                      content: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <DiscordEmojiPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => {
            setIsEmojiPickerOpen(false);
            setActiveEmojiIdx(null);
          }}
          triggerRect={emojiTriggerRect}
          onSelect={handleEmojiSelect}
        />
      )}
    </>
  );
}
