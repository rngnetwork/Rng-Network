"use client";

import React from 'react';
import { DiscordSeparatorComponent } from '../../types';

interface SeparatorEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordSeparatorComponent;
  onUpdateComponent?: (cIdx: number, compIdx: number, updated: DiscordSeparatorComponent) => void;
  onOpenSettings?: () => void;
}

export function SeparatorEditor({
  comp,
  onOpenSettings
}: SeparatorEditorProps) {
  const isDivider = comp.divider !== false;
  const spacing = comp.spacing === 2 ? 2 : 1;

  return (
    <div
      onClick={onOpenSettings}
      style={{
        width: '100%',
        cursor: onOpenSettings ? 'pointer' : 'default',
        userSelect: 'none'
      }}
      title={onOpenSettings ? "Click to edit Separator settings" : undefined}
    >
      {isDivider ? (
        <div style={{ padding: spacing === 2 ? '10px 0' : '4px 0', width: '100%' }}>
          <div
            style={{
              height: '1px',
              background: 'rgba(255, 255, 255, 0.15)',
              width: '100%'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: spacing === 2 ? '24px' : '14px',
            width: '100%',
            borderRadius: '4px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            background:
              'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04) 8px, transparent 8px, transparent 16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.35)', fontWeight: 500 }}>
            Empty Space ({spacing === 2 ? 'Large — 20px' : 'Small — 4px'})
          </span>
        </div>
      )}
    </div>
  );
}
