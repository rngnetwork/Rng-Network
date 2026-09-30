"use client";

import React, { useState } from 'react';
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
  if (!isOpen) return null;

  return (
    <SectionSettingsModalContent
      comp={comp}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function SectionSettingsModalContent({
  comp,
  onClose,
  onSave
}: {
  comp: DiscordSectionComponent;
  onClose: () => void;
  onSave: (updated: DiscordSectionComponent) => void;
}) {
  const initialAcc = comp.accessory;
  const initialUrl = initialAcc && 'media' in initialAcc && initialAcc.media?.url
    ? initialAcc.media.url
    : (initialAcc && 'url' in initialAcc && typeof initialAcc.url === 'string' ? initialAcc.url : '');

  const [customId, setCustomId] = useState(comp.id || '');
  const [text, setText] = useState(comp.text || (comp.components && comp.components[0]?.content) || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialUrl);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

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
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-dialog"
          style={{
            maxWidth: '580px',
            width: '100%',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.12)'
          }}
        >
          <div className="modal-header">
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-layer-group" style={{ color: '#fcd34d', fontSize: '14px' }} />
              </div>
              <span>Section Settings</span>
              <span className="component-modal-badge amber">Type 9 • Section</span>
            </div>
            <button className="btn-container-close" onClick={onClose} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="modal-body">
            {/* Custom ID */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Custom ID</span>
                <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: 400 }}>Unique identifier</span>
              </label>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                placeholder="e.g. section_rules_1"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
              />
            </div>

            {/* Markdown Text Area with Emoji Trigger */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Markdown Text Content</label>
                <button
                  type="button"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11.5px',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onClick={handleOpenEmojiPicker}
                >
                  <i className="fa-regular fa-face-smile" /> Emoji
                </button>
              </div>
              <textarea
                className="form-input"
                style={{ minHeight: '90px', resize: 'vertical', lineHeight: 1.5 }}
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
                    borderRadius: '8px',
                    background: '#111216',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
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

      <DiscordEmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={handleEmojiSelect}
        triggerRect={emojiTriggerRect}
      />
    </>
  );
}
