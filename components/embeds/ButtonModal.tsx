"use client";

import React, { useState } from 'react';
import { DiscordButtonComponent, ButtonStyle } from './types';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';
import { EmojiItem } from './emoji-data';

interface ButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonData: DiscordButtonComponent | null;
  onSave: (updated: DiscordButtonComponent) => void;
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
  onSave
}: ButtonModalProps) {
  if (!isOpen || !buttonData) return null;

  return (
    <ButtonModalContent
      buttonData={buttonData}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function ButtonModalContent({
  buttonData,
  onClose,
  onSave
}: {
  buttonData: DiscordButtonComponent;
  onClose: () => void;
  onSave: (updated: DiscordButtonComponent) => void;
}) {
  const [label, setLabel] = useState(buttonData.label || '');
  const [style, setStyle] = useState<ButtonStyle>(buttonData.style || 1);
  const [emojiStr, setEmojiStr] = useState(() => getInitialEmojiStr(buttonData.emoji));
  const [customId, setCustomId] = useState(buttonData.custom_id || '');
  const [url, setUrl] = useState(buttonData.url || '');
  const [disabled, setDisabled] = useState(Boolean(buttonData.disabled));
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

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
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100px', textAlign: 'center', fontSize: '15px' }}
                  placeholder="✨"
                  value={emojiStr}
                  onChange={(e) => setEmojiStr(e.target.value)}
                />
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
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custom ID</span>
                  <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: 400 }}>Event Handler ID</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  placeholder="e.g. verify_member_btn"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                />
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
