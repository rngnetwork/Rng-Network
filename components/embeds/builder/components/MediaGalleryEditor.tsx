"use client";

import React from 'react';
import { DiscordMediaGalleryComponent } from '../../types';

interface MediaGalleryEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordMediaGalleryComponent;
  onUpdateComponent?: (cIdx: number, compIdx: number, updated: DiscordMediaGalleryComponent) => void;
  onOpenSettings?: () => void;
}

export function MediaGalleryEditor({
  comp,
  onOpenSettings
}: MediaGalleryEditorProps) {
  const items = comp.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        {items.map((item, idx) => {
          const url = typeof item === 'string' ? item : item?.media?.url || '';

          return (
            <div
              key={idx}
              onClick={onOpenSettings}
              title="Click to edit in Media Gallery settings"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '6px',
                background: '#1e1f22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                cursor: onOpenSettings ? 'pointer' : 'default'
              }}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`Gallery image ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <i className="fa-regular fa-image" style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '20px' }} />
              )}
            </div>
          );
        })}

        {items.length < 4 && (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Add image in settings"
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: 'var(--discord-cyan)'
            }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: '14px' }} />
            <span style={{ fontSize: '10.5px', fontWeight: 600 }}>Add</span>
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div
          onClick={onOpenSettings}
          style={{
            padding: '16px',
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'var(--discord-text-muted)',
            background: '#1e1f22',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}
        >
          <i className="fa-solid fa-images" style={{ marginRight: '6px' }} />
          Gallery is empty. Click to add images in Settings.
        </div>
      )}
    </div>
  );
}
