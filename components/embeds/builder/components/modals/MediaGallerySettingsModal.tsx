"use client";

import React, { useState } from 'react';
import { DiscordMediaGalleryComponent, DiscordMediaItem } from '../../../types';

interface MediaGallerySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comp: DiscordMediaGalleryComponent;
  onSave: (updated: DiscordMediaGalleryComponent) => void;
}

function getMediaUrl(item: string | DiscordMediaItem): string {
  if (typeof item === 'string') return item;
  return item?.media?.url || '';
}

export function MediaGallerySettingsModal({
  isOpen,
  onClose,
  comp,
  onSave
}: MediaGallerySettingsModalProps) {
  const [customId, setCustomId] = useState(comp.id || '');
  const [items, setItems] = useState<(string | DiscordMediaItem)[]>(comp.items || []);
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  if (!isOpen) return null;

  const handleUpdateUrl = (idx: number, updatedUrl: string) => {
    const next = [...items];
    const curr = next[idx];
    if (typeof curr === 'object' && curr !== null) {
      next[idx] = { ...curr, media: { url: updatedUrl } };
    } else {
      next[idx] = updatedUrl;
    }
    setItems(next);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) {
      setUrlError('Please enter a valid image URL');
      return;
    }
    if (items.length >= 4) {
      setUrlError('Media gallery supports a maximum of 4 images');
      return;
    }
    setUrlError('');
    setItems([...items, { media: { url: trimmed } }]);
    setNewUrl('');
  };

  const handleSave = () => {
    const updated: DiscordMediaGalleryComponent = {
      ...comp,
      type: 12,
      id: customId.trim() || comp.id || `gallery_${Date.now()}`,
      items
    };
    onSave(updated);
    onClose();
  };

  return (
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
          maxWidth: '580px',
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
            <i className="fa-solid fa-images" style={{ color: '#5865F2' }} />
            <span>Media Gallery Settings (Type 12)</span>
          </div>
          <button className="btn-container-close" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 20px', overflowY: 'auto' }}>
          {/* Custom ID */}
          <div className="form-group">
            <label className="form-label">Custom ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. gallery_screenshots"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
          </div>

          {/* Current Images List */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Gallery Images ({items.length}/4)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
                Max 4 images per Discord gallery
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => {
                const url = getMediaUrl(item);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: '#1e1f22',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    {/* Thumbnail preview */}
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '4px',
                        background: '#141417',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <i className="fa-regular fa-image" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }} />
                      )}
                    </div>

                    {/* URL Input */}
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, fontSize: '12px' }}
                      placeholder="https://example.com/image.png"
                      value={url}
                      onChange={(e) => handleUpdateUrl(idx, e.target.value)}
                    />

                    {/* Delete button */}
                    <button
                      type="button"
                      className="comp-tool-btn btn-del"
                      title="Remove image"
                      style={{ width: '28px', height: '28px', fontSize: '12px' }}
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--discord-text-muted)', fontSize: '12.5px', background: '#1e1f22', borderRadius: '6px' }}>
                  No images in gallery. Add up to 4 images below.
                </div>
              )}
            </div>
          </div>

          {/* Add New Image Input (if < 4) */}
          {items.length < 4 && (
            <div className="form-group" style={{ background: '#2b2d31', padding: '12px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.15)' }}>
              <label className="form-label" style={{ fontSize: '11.5px', marginBottom: '6px' }}>Add New Image</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste image URL (PNG, JPG, WebP, GIF)..."
                  value={newUrl}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-add-option-pill"
                  style={{ whiteSpace: 'nowrap', padding: '0 14px', fontSize: '12px' }}
                  onClick={handleAddItem}
                >
                  <i className="fa-solid fa-plus" /> Add
                </button>
              </div>
              {urlError && (
                <div style={{ color: 'var(--discord-red)', fontSize: '11px', marginTop: '4px' }}>
                  {urlError}
                </div>
              )}
            </div>
          )}

          {/* Live Gallery Preview in Modal */}
          {items.length > 0 && (
            <div className="form-group">
              <label className="form-label">Live Gallery Preview</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: items.length === 1 ? '1fr' : items.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '6px',
                  background: '#1e1f22',
                  padding: '10px',
                  borderRadius: '6px',
                  maxHeight: '160px',
                  overflow: 'hidden'
                }}
              >
                {items.map((item, idx) => {
                  const url = getMediaUrl(item);
                  return (
                    <div
                      key={idx}
                      style={{
                        height: '90px',
                        background: '#141417',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <i className="fa-regular fa-image" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
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
              className="btn-container-close"
              style={{ padding: '8px 16px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}
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
  );
}
