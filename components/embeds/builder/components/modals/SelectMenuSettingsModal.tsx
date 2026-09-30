"use client";

import React, { useState } from 'react';
import { DiscordSelectComponent, SelectOption, PartialEmojiObject } from '../../../types';
import { DiscordEmojiPicker } from '../../../DiscordEmojiPicker';
import { EmojiItem } from '../../../emoji-data';

interface SelectMenuSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comp: DiscordSelectComponent;
  onSave: (updated: DiscordSelectComponent) => void;
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

export function SelectMenuSettingsModal({
  isOpen,
  onClose,
  comp,
  onSave
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
    const updated: DiscordSelectComponent = {
      ...comp,
      custom_id: customId.trim() || comp.custom_id || `select_${Date.now()}`,
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
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          backdropFilter: 'blur(10px)',
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-dialog"
          style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: 'min(88vh, 680px)',
            margin: 'auto',
            background: '#313338',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{
              background: '#2b2d31',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#5865F2' }} />
              <span>Select Menu Settings ({typeLabels[comp.type] || `Type ${comp.type}`})</span>
            </div>
            <button className="btn-container-close" onClick={onClose} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px', overflowY: 'auto' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {options.map((opt, optIdx) => {
                    const emojiStr = formatEmoji(opt.emoji);

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
                          border: '1px solid rgba(255, 255, 255, 0.06)'
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
                            style={{ flex: 1, fontSize: '11.5px', color: 'var(--discord-cyan)' }}
                            placeholder="Option Value"
                            value={opt.value}
                            onChange={(e) => handleUpdateOption(optIdx, { value: e.target.value })}
                          />

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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
            <button
              type="button"
              className="sub-tab-btn"
              style={{ padding: '8px 20px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}
              onClick={onClose}
            >
              Cancel
            </button>
              <button
                type="button"
                className="btn-dispatch-submit"
                style={{ width: 'auto', padding: '8px 20px' }}
                onClick={handleSave}
              >
                Save Changes
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
          onSelect={handleEmojiSelect}
          triggerRect={emojiTriggerRect}
        />
      )}
    </>
  );
}
