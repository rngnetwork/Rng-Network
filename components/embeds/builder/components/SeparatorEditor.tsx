"use client";

import React from 'react';
import { DiscordSeparatorComponent } from '../../types';

interface SeparatorEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordSeparatorComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordSeparatorComponent) => void;
}

export function SeparatorEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: SeparatorEditorProps) {
  const isDivider = comp.divider !== false;
  const spacing = comp.spacing === 2 ? 2 : 1;

  const handleUpdate = (patch: Partial<DiscordSeparatorComponent>) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, ...patch });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#1e1f22', padding: '6px 12px', borderRadius: '4px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#fff', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isDivider}
          onChange={(e) => handleUpdate({ divider: e.target.checked })}
        />
        <span>Show Divider Line</span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>Spacing:</span>
        <button
          type="button"
          className={`btn-style-chip ${spacing === 1 ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '11px' }}
          onClick={() => handleUpdate({ spacing: 1 })}
        >
          1 (Small)
        </button>
        <button
          type="button"
          className={`btn-style-chip ${spacing === 2 ? 'active' : ''}`}
          style={{ padding: '3px 8px', fontSize: '11px' }}
          onClick={() => handleUpdate({ spacing: 2 })}
        >
          2 (Large)
        </button>
      </div>

      <div style={{ marginLeft: 'auto', flex: 1, height: isDivider ? '1px' : '0px', background: 'rgba(255,255,255,0.15)' }} />
    </div>
  );
}
