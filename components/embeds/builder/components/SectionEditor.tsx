"use client";

import React from 'react';
import { DiscordSectionComponent } from '../../types';

interface SectionEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordSectionComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordSectionComponent) => void;
}

export function SectionEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: SectionEditorProps) {
  const currentText = comp.text || (comp.components && comp.components[0]?.content) || '';
  const accessory = comp.accessory;
  const accessoryUrl = accessory && 'media' in accessory && accessory.media?.url ? accessory.media.url : (accessory && 'url' in accessory && typeof accessory.url === 'string' ? accessory.url : '');

  const handleTextChange = (text: string) => {
    onUpdateComponent(cIdx, compIdx, {
      ...comp,
      text,
      components: [{ type: 10, content: text }]
    });
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {/* Markdown Text Area (Left Column) */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>
          Section Markdown Text
        </label>
        <textarea
          className="bare-input"
          style={{
            width: '100%',
            fontSize: '12.5px',
            background: '#1e1f22',
            padding: '8px 10px',
            borderRadius: '4px',
            minHeight: '64px',
            resize: 'vertical',
            lineHeight: 1.45
          }}
          value={currentText}
          placeholder="Section markdown text (click settings for emoji & options)..."
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      {/* Thumbnail Accessory (Right Column) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <label style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>
          Thumbnail
        </label>
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
          title={accessoryUrl ? "Thumbnail Accessory Preview" : "No thumbnail configured (use Settings to add)"}
        >
          {accessoryUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={accessoryUrl}
              alt="Section Thumbnail"
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
  );
}
