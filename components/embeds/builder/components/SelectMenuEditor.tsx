"use client";

import React from 'react';
import { DiscordSelectComponent, SelectOption } from '../../types';

interface SelectMenuEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordSelectComponent;
  onUpdateComponent?: (cIdx: number, compIdx: number, updated: DiscordSelectComponent) => void;
  onOpenSettings?: () => void;
}

function formatEmoji(emoji?: string | { name: string; id?: string; animated?: boolean }): string {
  if (!emoji) return '';
  if (typeof emoji === 'string') return emoji;
  if (emoji.id) {
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
  }
  return emoji.name || '';
}

export function SelectMenuEditor({
  comp,
  onOpenSettings
}: SelectMenuEditorProps) {
  const options: SelectOption[] = comp.options || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Dropdown Box Simulator (Click opens settings) */}
      <div
        onClick={onOpenSettings}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1e1f22',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: onOpenSettings ? 'pointer' : 'default',
          color: comp.placeholder ? '#dbdee1' : 'var(--discord-text-muted)',
          fontSize: '12.5px',
          userSelect: 'none'
        }}
        title={onOpenSettings ? "Click to configure in Settings" : undefined}
      >
        <span style={{ fontWeight: 500 }}>
          {comp.placeholder || 'Select an option...'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {comp.type === 3 && (
            <span style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>
              ({options.length} {options.length === 1 ? 'option' : 'options'})
            </span>
          )}
          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', color: 'var(--discord-text-muted)' }} />
        </div>
      </div>

      {/* Options Summary Pills (For String Select Type 3) */}
      {comp.type === 3 && options.length > 0 && (
        <div
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            cursor: onOpenSettings ? 'pointer' : 'default'
          }}
          title={onOpenSettings ? "Click to configure options in Settings" : undefined}
        >
          {options.map((opt, idx) => {
            const emo = formatEmoji(opt.emoji);
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#1e1f22',
                  border: `1px solid ${opt.default ? 'rgba(88, 101, 242, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: opt.default ? 'var(--discord-cyan)' : '#dbdee1'
                }}
              >
                {emo && <span>{emo}</span>}
                <span style={{ fontWeight: 500 }}>{opt.label || `Option ${idx + 1}`}</span>
                {opt.default && <i className="fa-solid fa-check" style={{ fontSize: '9px', color: 'var(--discord-green)' }} />}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
