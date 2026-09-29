"use client";

import React, { useState, useEffect } from 'react';
import { DiscordButtonComponent, ButtonStyle } from './types';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';
import { EmojiItem } from './emoji-data';

interface ButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonData: DiscordButtonComponent | null;
  onSave: (updated: DiscordButtonComponent) => void;
}

export function ButtonModal({
  isOpen,
  onClose,
  buttonData,
  onSave
}: ButtonModalProps) {
  const [label, setLabel] = useState('');
  const [style, setStyle] = useState<ButtonStyle>(1);
  const [emojiStr, setEmojiStr] = useState('');
  const [customId, setCustomId] = useState('');
  const [url, setUrl] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (buttonData) {
      setLabel(buttonData.label || '');
      setStyle(buttonData.style || 1);
      if (typeof buttonData.emoji === 'string') {
        setEmojiStr(buttonData.emoji);
      } else if (buttonData.emoji && typeof buttonData.emoji === 'object') {
        const emo = buttonData.emoji;
        setEmojiStr(emo.id ? `<${emo.animated ? 'a' : ''}:${emo.name}:${emo.id}>` : (emo.name || ''));
      } else {
        setEmojiStr('');
      }
      setCustomId(buttonData.custom_id || '');
      setUrl(buttonData.url || '');
      setDisabled(Boolean(buttonData.disabled));
    }
  }, [buttonData, isOpen]);

  if (!isOpen || !buttonData) return null;

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
            maxWidth: '520px',
            width: '100%',
            maxHeight: 'min(88vh, 650px)',
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
          <div className="modal-header" style={{ background: '#2b2d31', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-gamepad" style={{ color: '#5865F2' }} />
              <span>Customize Discord Button (Type 2)</span>
            </div>
            <button className="btn-container-close" onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px', overflowY: 'auto' }}>
            
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
              <label className="form-label">Button Type</label>
              <div className="btn-style-selector-row">
                <button
                  type="button"
                  className={`btn-style-chip btn-style-1 ${style === 1 ? 'active' : ''}`}
                  onClick={() => setStyle(1)}
                >
                  Primary (Blurple)
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-2 ${style === 2 ? 'active' : ''}`}
                  onClick={() => setStyle(2)}
                >
                  Secondary (Grey)
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-3 ${style === 3 ? 'active' : ''}`}
                  onClick={() => setStyle(3)}
                >
                  Success (Green)
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-4 ${style === 4 ? 'active' : ''}`}
                  onClick={() => setStyle(4)}
                >
                  Danger (Red)
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-5 ${style === 5 ? 'active' : ''}`}
                  onClick={() => setStyle(5)}
                >
                  Link (URL)
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
                  placeholder=""
                  value={emojiStr}
                  onChange={(e) => setEmojiStr(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-open-picker-pill"
                  onClick={handleOpenEmojiPicker}
                >
                  <i className="fa-regular fa-face-smile" /> Pick Discord Emoji
                </button>
                <div className="quick-emojis-list">
                  <span className="quick-emoji-chip" onClick={() => setEmojiStr('😃')}>😃</span>
                  <span className="quick-emoji-chip" onClick={() => setEmojiStr('🚀')}>🚀</span>
                  <span className="quick-emoji-chip" onClick={() => setEmojiStr('⚡')}>⚡</span>
                  <span className="quick-emoji-chip" onClick={() => setEmojiStr('🔥')}>🔥</span>
                  <span className="quick-emoji-chip" onClick={() => setEmojiStr('<:pepe_hype:10182738491823>')}>🐸</span>
                  <span className="quick-emoji-chip" onClick={() => setEmojiStr('<a:nitro_boost:98765432109876>')}>🚀</span>
                </div>
              </div>
            </div>

            {style !== 5 ? (
              <div className="form-group">
                <label className="form-label">Custom ID (Event Handler Identifier)</label>
                <input
                  type="text"
                  className="form-input"
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#fff', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                />
                <span>Disabled Button State</span>
              </label>
              <button
                type="button"
                className="btn-dispatch-submit"
                style={{ width: 'auto', padding: '8px 20px' }}
                onClick={handleSave}
              >
                Save Button
              </button>
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
