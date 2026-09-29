"use client";

import React from 'react';
import { DiscordMediaGalleryComponent } from '../../types';

interface MediaGalleryEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordMediaGalleryComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordMediaGalleryComponent) => void;
}

export function MediaGalleryEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: MediaGalleryEditorProps) {
  const items = comp.items || [];

  const handleUpdateItems = (newItems: any[]) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, items: newItems });
  };

  const handleAddItem = () => {
    if (items.length >= 4) {
      alert('Discord Media Gallery supports up to 4 items in a single message.');
      return;
    }
    handleUpdateItems([...items, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400']);
  };

  const handleUpdateItem = (idx: number, url: string) => {
    const updated = [...items];
    updated[idx] = url;
    handleUpdateItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    const updated = [...items];
    updated.splice(idx, 1);
    handleUpdateItems(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
          Media Gallery Items ({items.length}/4)
        </span>
        {items.length < 4 && (
          <button
            type="button"
            className="btn-add-option-pill"
            onClick={handleAddItem}
          >
            <i className="fa-solid fa-plus" /> Add Image URL
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, idx) => {
          const url = typeof item === 'object' && item?.media?.url ? item.media.url : (item as string);

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e1f22', padding: '4px 8px', borderRadius: '4px' }}>
              <i className="fa-regular fa-image" style={{ color: 'var(--discord-cyan)', fontSize: '12px' }} />
              <input
                type="text"
                className="bare-input"
                style={{ flex: 1, fontSize: '11.5px' }}
                value={url}
                placeholder="Image Media URL..."
                onChange={(e) => handleUpdateItem(idx, e.target.value)}
              />
              <button
                type="button"
                className="comp-tool-btn btn-del"
                style={{ width: '20px', height: '20px' }}
                onClick={() => handleRemoveItem(idx)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
