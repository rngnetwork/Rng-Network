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
  const accessory = comp.accessory as any;
  const accessoryType = accessory?.type === 2 || accessory?.type === 'button' ? 'button' : 'thumbnail';
  const accessoryUrl = accessory?.media?.url || accessory?.url || '';
  const accessoryLabel = accessory?.label || 'Action';

  const handleUpdate = (patch: Partial<DiscordSectionComponent>) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, ...patch });
  };

  const handleTextChange = (text: string) => {
    handleUpdate({
      text,
      components: [{ type: 10, content: text }]
    });
  };

  const handleAccessoryTypeChange = (type: 'thumbnail' | 'button') => {
    if (type === 'thumbnail') {
      handleUpdate({
        accessory: {
          type: 11,
          media: { url: accessoryUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100' }
        }
      });
    } else {
      handleUpdate({
        accessory: {
          type: 2,
          style: 1,
          label: accessoryLabel || 'Section Button',
          custom_id: `sec_btn_${Date.now()}`
        } as any
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <label style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>Section Content (Markdown)</label>
        <textarea
          className="bare-input"
          style={{ width: '100%', fontSize: '12px', background: '#1e1f22', padding: '6px 8px', borderRadius: '4px', minHeight: '50px' }}
          value={currentText}
          placeholder="Section markdown text..."
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>Accessory:</span>
        <button
          type="button"
          className={`btn-style-chip ${accessoryType === 'thumbnail' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '11px' }}
          onClick={() => handleAccessoryTypeChange('thumbnail')}
        >
          Thumbnail
        </button>
        <button
          type="button"
          className={`btn-style-chip ${accessoryType === 'button' ? 'active' : ''}`}
          style={{ padding: '4px 8px', fontSize: '11px' }}
          onClick={() => handleAccessoryTypeChange('button')}
        >
          Button
        </button>

        {accessoryType === 'thumbnail' ? (
          <input
            type="text"
            className="bare-input"
            style={{ flex: 1, fontSize: '11.5px', background: '#1e1f22', padding: '5px 8px', borderRadius: '4px' }}
            value={accessoryUrl}
            placeholder="Thumbnail Image URL..."
            onChange={(e) => handleUpdate({
              accessory: { type: 11, media: { url: e.target.value } }
            })}
          />
        ) : (
          <input
            type="text"
            className="bare-input"
            style={{ flex: 1, fontSize: '11.5px', background: '#1e1f22', padding: '5px 8px', borderRadius: '4px' }}
            value={accessoryLabel}
            placeholder="Button Label..."
            onChange={(e) => handleUpdate({
              accessory: {
                type: 2,
                style: 1,
                label: e.target.value,
                custom_id: accessory?.custom_id || `sec_btn_${Date.now()}`
              } as any
            })}
          />
        )}
      </div>
    </div>
  );
}
