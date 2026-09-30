"use client";

import React, { useState, useEffect } from 'react';
import { DiscordSectionComponent } from '../../../types';
import { DiscordEmojiPicker } from '../../../DiscordEmojiPicker';
import { EmojiItem } from '../../../emoji-data';

interface SectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comp: DiscordSectionComponent;
  onSave: (updated: DiscordSectionComponent) => void;
}

export function SectionSettingsModal({
  isOpen,
  onClose,
  comp,
  onSave
}: SectionSettingsModalProps) {
  const [customId, setCustomId] = useState(comp.id || '');
  const [text, setText] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomId(comp.id || '');
      const initialText = comp.text || (comp.components && comp.components[0]?.content) || '';
      setText(initialText);
      const acc = comp.accessory;
      const initialUrl = acc && 'media' in acc && acc.media?.url ? acc.media.url : (acc && 'url' in acc && typeof acc.url === 'string' ? acc.url : '');
      setThumbnailUrl(initialUrl);
    }
  }, [isOpen, comp]);

  if (!isOpen) return null;

  const handleOpenEmojiPicker = (e: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiTriggerRect(e.currentTarget.getBoundingClientRect());
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiSelect = (_emoji: EmojiItem, insertString: string) => {
    setText((prev) => prev + insertString);
    setIsEmojiPickerOpen(false);
  };

  const handleSave = () => {
    const updated: DiscordSectionComponent = {
      ...comp,
      id: customId.trim() || comp.id || `sec_${Date.now()}`,
      text: text.trim(),
      components: [{ type: 10, content: text.trim() }],
      accessory: thumbnailUrl.trim()
        ? {
            type: 11,
            media: { url: thumbnailUrl.trim() }
          }
        : undefined
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
            maxWidth: '560px',
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
          <div className="modal-header" style={{ background: '#2b2d31', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-layer-group" style={{ color: '#5865F2' }} />
              <span>Section Settings (Type 9)</span>
            </div>
            <button className="btn-container-close" onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px', overflowY: 'auto' }}>
            {/* Custom ID */}
            <div className="form-group">
              <label className="form-label">Custom ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. section_rules_1"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
              />
            </div>

            {/* Markdown Text Area with Emoji Trigger */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Markdown Text</label>
                <button
                  type="button"
                  className="btn-open-picker-pill"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={handleOpenEmojiPicker}
                >
                  <i className="fa-regular fa-face-smile" /> Emoji
                </button>
              </div>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter markdown content..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Accessory Thumbnail URL & Preview */}
            <div className="form-group">
              <label className="form-label">Accessory Thumbnail URL</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://images.unsplash.com/... or image URL"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)', marginTop: '4px', display: 'block' }}>
                    Thumbnail image is displayed aligned to the right side of the section text.
                  </span>
                </div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '6px',
                    background: '#1e1f22',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <i className="fa-solid fa-image" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
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

      <DiscordEmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={handleEmojiSelect}
        triggerRect={emojiTriggerRect}
      />
    </>
  );
}
