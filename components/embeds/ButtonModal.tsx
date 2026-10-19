"use client";

import React, { useState, useEffect } from 'react';
import { DiscordButtonComponent, ButtonStyle, EmbedAction, Type17Container } from './types';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';
import { EmojiItem } from './emoji-data';
import { renderDiscordEmoji } from './DiscordEmojiRenderer';
import { GlassmorphicDropdown } from '@/components/ui/GlassmorphicDropdown';
import { api } from '@/lib/api';

interface ButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonData: DiscordButtonComponent | null;
  onSave: (updated: DiscordButtonComponent) => void;
  availableActions?: EmbedAction[];
  serverId?: string;
  allContainers?: Type17Container[];
}

function getInitialEmojiStr(emoji: DiscordButtonComponent['emoji']): string {
  if (typeof emoji === 'string') return emoji;
  if (emoji && typeof emoji === 'object') {
    return emoji.id ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : (emoji.name || '');
  }
  return '';
}

export function ButtonModal({
  isOpen,
  onClose,
  buttonData,
  onSave,
  availableActions,
  serverId,
  allContainers
}: ButtonModalProps) {
  if (!isOpen || !buttonData) return null;

  return (
    <ButtonModalContent
      buttonData={buttonData}
      onClose={onClose}
      onSave={onSave}
      availableActions={availableActions}
      serverId={serverId}
      allContainers={allContainers}
    />
  );
}

function ButtonModalContent({
  buttonData,
  onClose,
  onSave,
  availableActions,
  serverId,
  allContainers
}: {
  buttonData: DiscordButtonComponent;
  onClose: () => void;
  onSave: (updated: DiscordButtonComponent) => void;
  availableActions?: EmbedAction[];
  serverId?: string;
  allContainers?: Type17Container[];
}) {
  const [label, setLabel] = useState(buttonData.label || '');
  const [style, setStyle] = useState<ButtonStyle>(buttonData.style || 1);
  const [emojiStr, setEmojiStr] = useState(() => getInitialEmojiStr(buttonData.emoji));
  const [customId, setCustomId] = useState(buttonData.custom_id || '');
  const [url, setUrl] = useState(buttonData.url || '');
  const [disabled, setDisabled] = useState(Boolean(buttonData.disabled));
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

  const [fetchedActions, setFetchedActions] = useState<EmbedAction[]>([]);
  const actionsList = React.useMemo(() => {
    if (fetchedActions.length > 0) {
      return fetchedActions;
    }
    return availableActions || [];
  }, [availableActions, fetchedActions]);

  // Check which actions are already used by other buttons or select menus in the message canvas
  const canvasUsedActions = React.useMemo(() => {
    const buttonActions = new Map<string, string>();
    const userSelectActions = new Set<string>();
    const roleSelectActions = new Set<string>();

    if (!allContainers) return { buttonActions, userSelectActions, roleSelectActions };

    for (const c of allContainers) {
      for (const comp of c.components || []) {
        if (comp.type === 1 && (comp as any).components) {
          for (const btn of (comp as any).components) {
            if (btn.id !== buttonData.id && btn.custom_id && btn.custom_id.startsWith('rng_act_')) {
              buttonActions.set(btn.custom_id, btn.label || btn.custom_id);
            }
          }
        }
        if (comp.type === 5 && (comp as any).custom_id && (comp as any).custom_id.startsWith('rng_act_')) {
          userSelectActions.add((comp as any).custom_id);
        }
        if (comp.type === 6 && (comp as any).custom_id && (comp as any).custom_id.startsWith('rng_act_')) {
          roleSelectActions.add((comp as any).custom_id);
        }
      }
    }
    return { buttonActions, userSelectActions, roleSelectActions };
  }, [allContainers, buttonData.id]);

  const selectedAction = React.useMemo(() => {
    return actionsList.find((act) => act.actionId === customId);
  }, [actionsList, customId]);

  const [actionSourceMode, setActionSourceMode] = useState<'template' | 'custom'>(
    (buttonData.custom_id?.startsWith('rng_act_') || !buttonData.custom_id) ? 'template' : 'custom'
  );

  useEffect(() => {
    let isMounted = true;
    const loadActions = async () => {
      try {
        const loaded: EmbedAction[] = [];
        if (serverId) {
          try {
            const serverRes = await api.fetchServerActions(serverId);
            if (serverRes.success && serverRes.data) {
              const list = Array.isArray(serverRes.data) ? serverRes.data : ((serverRes.data as any).content || []);
              loaded.push(...list);
            }
          } catch (e) {
            console.warn('Could not fetch server actions in ButtonModal:', e);
          }
        }
        try {
          const res = await api.fetchActionTemplates();
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : ((res.data as any).content || []);
            loaded.push(...list);
          }
        } catch (e) {
          console.warn('Could not fetch global action templates in ButtonModal:', e);
        }

        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('rng_embed_actions');
          } catch {}
        }

        const map = new Map<string, EmbedAction>();
        loaded.forEach((a: EmbedAction) => {
          if (a.actionId) map.set(a.actionId, a);
        });
        const deduplicated = Array.from(map.values());
        if (isMounted && deduplicated.length > 0) {
          setFetchedActions(deduplicated);
        }
      } catch (err) {
        console.warn('Could not fetch action templates in ButtonModal:', err);
      }
    };

    loadActions();
    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const handleOpenEmojiPicker = (e: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiTriggerRect(e.currentTarget.getBoundingClientRect());
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiSelect = (emoji: EmojiItem, insertString: string) => {
    setEmojiStr(insertString);
    setIsEmojiPickerOpen(false);
  };

  const handleSave = () => {
    let parsedEmoji: string | { name: string; id?: string; animated?: boolean } | undefined = undefined;
    if (emojiStr.trim()) {
      const match = emojiStr.trim().match(/<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/);
      if (match) {
        parsedEmoji = {
          animated: match[1] === 'a',
          name: match[2],
          id: match[3]
        };
      } else {
        parsedEmoji = emojiStr.trim();
      }
    }

    const updated: DiscordButtonComponent = {
      type: 2,
      id: buttonData.id,
      label: label.trim(),
      style,
      emoji: parsedEmoji,
      disabled,
      custom_id: style !== 5 ? (customId.trim() || `btn_${Date.now()}`) : undefined,
      url: style === 5 ? (url.trim() || 'https://discord.com') : undefined
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
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(88, 101, 242, 0.12)'
          }}
        >
          <div className="modal-header">
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(88, 101, 242, 0.15)', border: '1px solid rgba(88, 101, 242, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-gamepad" style={{ color: '#a5b4fc', fontSize: '14px' }} />
              </div>
              <span>Button Settings</span>
              <span className="component-modal-badge blurple">Type 2 • Button</span>
            </div>
            <button className="btn-container-close" onClick={onClose} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body">
            
            <div className="form-group">
              <label className="form-label">Button Label / Text</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Click Me / Accept / View"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Button Style (Discord Specification)</label>
              <div className="btn-style-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-1 ${style === 1 ? 'active' : ''}`}
                  onClick={() => setStyle(1)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 1 ? '#5865F2' : 'rgba(88, 101, 242, 0.15)',
                    border: style === 1 ? '1px solid #7983f5' : '1px solid rgba(88, 101, 242, 0.3)',
                    color: style === 1 ? '#fff' : '#a5b4fc',
                    boxShadow: style === 1 ? '0 0 14px rgba(88, 101, 242, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Primary
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-2 ${style === 2 ? 'active' : ''}`}
                  onClick={() => setStyle(2)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 2 ? '#4e5058' : 'rgba(255, 255, 255, 0.08)',
                    border: style === 2 ? '1px solid #6d6f78' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    boxShadow: style === 2 ? '0 0 14px rgba(78, 80, 88, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Secondary
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-3 ${style === 3 ? 'active' : ''}`}
                  onClick={() => setStyle(3)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 3 ? '#23a55a' : 'rgba(35, 165, 90, 0.15)',
                    border: style === 3 ? '1px solid #2dc76d' : '1px solid rgba(35, 165, 90, 0.3)',
                    color: style === 3 ? '#fff' : '#4ade80',
                    boxShadow: style === 3 ? '0 0 14px rgba(35, 165, 90, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Success
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-4 ${style === 4 ? 'active' : ''}`}
                  onClick={() => setStyle(4)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 4 ? '#da373c' : 'rgba(218, 55, 60, 0.15)',
                    border: style === 4 ? '1px solid #f23f43' : '1px solid rgba(218, 55, 60, 0.3)',
                    color: style === 4 ? '#fff' : '#f87171',
                    boxShadow: style === 4 ? '0 0 14px rgba(218, 55, 60, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Danger
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-5 ${style === 5 ? 'active' : ''}`}
                  onClick={() => setStyle(5)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 5 ? '#4e5058' : 'rgba(255, 255, 255, 0.08)',
                    border: style === 5 ? '1px solid #6d6f78' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    boxShadow: style === 5 ? '0 0 14px rgba(78, 80, 88, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }} />
                  <span>Link</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Emoji (Unicode or Discord Bot)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {renderDiscordEmoji(emojiStr, 22) || <i className="fa-regular fa-face-smile" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }} />}
                </div>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '130px', fontSize: '13px' }}
                  placeholder="✨ or <:name:id>"
                  value={emojiStr}
                  onChange={(e) => setEmojiStr(e.target.value)}
                />
                {emojiStr && (
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                    title="Clear Emoji"
                    onClick={() => setEmojiStr('')}
                  >
                    <i className="fa-solid fa-xmark" style={{ fontSize: '12px' }} />
                  </button>
                )}
                <button
                  type="button"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={handleOpenEmojiPicker}
                >
                  <i className="fa-regular fa-face-smile" /> Pick Discord Emoji
                </button>
                <div className="quick-emojis-list" style={{ display: 'flex', gap: '4px' }}>
                  {['😃', '🚀', '⚡', '🔥'].map((emo) => (
                    <span
                      key={emo}
                      className="quick-emoji-chip"
                      onClick={() => setEmojiStr(emo)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {emo}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {style !== 5 ? (
              <div className="form-group space-y-2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>Action Custom ID Binding</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActionSourceMode('template')}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all ${
                        actionSourceMode === 'template'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
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

                {actionSourceMode === 'template' ? (
                  actionsList.length > 0 ? (
                    <div className="space-y-1.5">
                      <GlassmorphicDropdown
                        options={[
                          ...(customId && customId.startsWith('rng_act_') && !actionsList.some((act) => act.actionId === customId)
                            ? [{
                                value: customId,
                                label: `${customId} (Unregistered / Stale)`,
                                description: 'This action was deleted or does not exist in registry. Please re-select.',
                                badge: 'STALE'
                              }]
                            : []),
                          ...actionsList.map((act) => {
                            const isUsedByOtherButton = canvasUsedActions.buttonActions.has(act.actionId);
                            const otherBtnLabel = canvasUsedActions.buttonActions.get(act.actionId);
                            return {
                              value: act.actionId,
                              label: act.name,
                              description: isUsedByOtherButton
                                ? `⚠️ Already mapped to button "${otherBtnLabel}" in this message`
                                : (act.description || act.actionId),
                              badge: act.actionType,
                              disabled: isUsedByOtherButton
                            };
                          })
                        ]}
                        value={customId}
                        onChange={(val) => setCustomId(val)}
                        placeholder="Select interactive action template..."
                        searchable
                      />

                      {/* 3-Way Role Grant Component Binding Status Widget */}
                      {selectedAction && (selectedAction.actionType === 'ROLE' || selectedAction.requiredUser || selectedAction.requiredRole) && (
                        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                              <i className="fa-solid fa-link text-indigo-400" />
                              Role Grant 3-Way Component Binding
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                              1 Button • 1 User • 1 Role
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            This action coordinates execution between a Button, a User Select, and a Role Select in this message.
                          </p>
                          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                            <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                              <i className="fa-solid fa-check text-[10px]" /> Button (This)
                            </div>
                            <div className={`p-1.5 rounded border text-[11px] flex items-center gap-1 ${
                              canvasUsedActions.userSelectActions.has(selectedAction.actionId)
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              <i className={`fa-solid ${canvasUsedActions.userSelectActions.has(selectedAction.actionId) ? 'fa-check' : 'fa-circle-exclamation'} text-[10px]`} />
                              User Select
                            </div>
                            <div className={`p-1.5 rounded border text-[11px] flex items-center gap-1 ${
                              canvasUsedActions.roleSelectActions.has(selectedAction.actionId)
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              <i className={`fa-solid ${canvasUsedActions.roleSelectActions.has(selectedAction.actionId) ? 'fa-check' : 'fa-circle-exclamation'} text-[10px]`} />
                              Role Select
                            </div>
                          </div>
                        </div>
                      )}
                      {customId && customId.startsWith('rng_act_') && !actionsList.some((act) => act.actionId === customId) && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                          <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white">Stale / Unregistered Action ID:</span>
                            <p className="text-[11px] text-amber-200/80 leading-relaxed">
                              This button references <code className="font-mono text-amber-300">{customId}</code>, which was deleted or not found in the active action registry. Please re-select an active template above before dispatching.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
                        <span>Bound ID: {customId || 'None'}</span>
                        {customId.startsWith('rng_act_') && actionsList.some((act) => act.actionId === customId) ? (
                          <span className="text-emerald-400">✓ JDA Gateway Handled</span>
                        ) : customId.startsWith('rng_act_') ? (
                          <span className="text-amber-400 font-semibold">⚠️ Unregistered in Registry</span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span>No action templates created yet.</span>
                        <button
                          type="button"
                          onClick={() => setActionSourceMode('custom')}
                          className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10.5px] font-semibold hover:bg-amber-500/30 transition-colors"
                        >
                          Use Custom ID
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Create an Action Template under the <strong>Action Templates</strong> tab above, then map it here.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                      placeholder="e.g. verify_member_btn or rng_act_..."
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                    />
                    {customId && customId.startsWith('rng_act_') && !actionsList.some((act) => act.actionId === customId) && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white">Stale / Unregistered Action ID:</span>
                          <p className="text-[11px] text-amber-200/80 leading-relaxed">
                            <code className="font-mono text-amber-300">{customId}</code> is not registered in the database. Clicking this button in Discord will trigger an action not found error.
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-[10.5px] text-zinc-500">
                      Custom Discord component custom_id string.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Target URL (For Link Buttons)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://discord.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            )}

            <div className="modal-footer" style={{ padding: '14px 0 0 0', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#dbdee1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  style={{ accentColor: '#E11D2E', width: '15px', height: '15px' }}
                />
                <span>Disabled Button State</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <span>Save Button</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DiscordEmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={handleEmojiSelect}
        triggerRect={emojiTriggerRect}
      />
    </>
  );
}
