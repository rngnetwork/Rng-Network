"use client";

import React from 'react';
import { DiscordSelectComponent, SelectOption } from '../../types';
import { renderDiscordEmoji } from '../../DiscordEmojiRenderer';

interface SelectMenuEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordSelectComponent;
  onUpdateComponent?: (cIdx: number, compIdx: number, updated: DiscordSelectComponent) => void;
  onOpenSettings?: () => void;
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
        className="group transition-all duration-200 hover:border-red-500/40"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(20, 22, 28, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '10px 14px',
          cursor: onOpenSettings ? 'pointer' : 'default',
          color: comp.placeholder ? '#dbdee1' : 'var(--discord-text-muted)',
          fontSize: '13px',
          userSelect: 'none',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
        }}
        title={onOpenSettings ? "Click to configure in Settings" : undefined}
      >
        <span style={{ fontWeight: 500 }}>
          {comp.placeholder || 'Select an option...'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {comp.type === 3 && (
            <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
              ({options.length} {options.length === 1 ? 'option' : 'options'})
            </span>
          )}
          <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }} />
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
                {renderDiscordEmoji(opt.emoji, 13)}
                <span style={{ fontWeight: 500 }}>{opt.label || `Option ${idx + 1}`}</span>
                {opt.default && <i className="fa-solid fa-check" style={{ fontSize: '9px', color: 'var(--discord-green)' }} />}
              </span>
            );
          })}
        </div>
      )}

      {/* Execution Indicator */}
      {comp.type === 3 && (
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10.5px] text-zinc-400 cursor-pointer hover:border-white/10 transition-colors"
        >
          <i className="fa-solid fa-hand-pointer text-[9px] text-amber-400" />
          <span>
            {(comp as any).invokerButtonId
              ? 'Action invokes on mapped button click'
              : 'Mapped button click required to invoke action'}
          </span>
        </div>
      )}
    </div>
  );
}
