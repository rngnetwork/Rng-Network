"use client";

import React from 'react';
import { DiscordActionRowComponent, DiscordButtonComponent, ButtonStyle } from '../../types';

interface ActionRowEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordActionRowComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordActionRowComponent) => void;
  onOpenButtonModal: (cIdx: number, rowId: string, bIdx: number, data: DiscordButtonComponent) => void;
}

const BUTTON_STYLE_CLASSES: Record<ButtonStyle, string> = {
  1: 'btn-style-1',
  2: 'btn-style-2',
  3: 'btn-style-3',
  4: 'btn-style-4',
  5: 'btn-style-5'
};

export function ActionRowEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent,
  onOpenButtonModal
}: ActionRowEditorProps) {
  const items = comp.items || (comp.components as DiscordButtonComponent[]) || [];

  const handleAddButton = () => {
    if (items.length >= 5) {
      alert('An Action Row can hold a maximum of 5 buttons.');
      return;
    }
    const newBtn: DiscordButtonComponent = {
      type: 2,
      style: 1,
      label: `Button ${items.length + 1}`,
      custom_id: `btn_${Date.now()}`
    };
    const updated = {
      ...comp,
      items: [...items, newBtn]
    };
    onUpdateComponent(cIdx, compIdx, updated);
  };

  const handleRemoveButton = (e: React.MouseEvent, bIdx: number) => {
    e.stopPropagation();
    const updatedItems = [...items];
    updatedItems.splice(bIdx, 1);
    onUpdateComponent(cIdx, compIdx, {
      ...comp,
      items: updatedItems
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {comp.label || 'Action Row Controls'} ({items.length}/5 Buttons)
        </span>
        {items.length < 5 && (
          <button
            type="button"
            className="btn-add-option-pill"
            onClick={handleAddButton}
          >
            <i className="fa-solid fa-plus" /> Add Button
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {items.map((item, bIdx) => {
          const btn = item as DiscordButtonComponent;
          const styleClass = BUTTON_STYLE_CLASSES[btn.style as ButtonStyle] || 'btn-style-1';
          const emojiDisplay = typeof btn.emoji === 'object' ? btn.emoji.name : btn.emoji;

          return (
            <div
              key={btn.id || bIdx}
              className={`btn-style-chip ${styleClass}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px' }}
              onClick={() => onOpenButtonModal(cIdx, comp.id || `row_${compIdx}`, bIdx, btn)}
              title="Click to customize button style, emoji, and ID"
            >
              {emojiDisplay && <span>{emojiDisplay}</span>}
              <span style={{ fontWeight: 600 }}>{btn.label || 'Button'}</span>
              {btn.style === 5 && <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }} />}
              <button
                type="button"
                onClick={(e) => handleRemoveButton(e, bIdx)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginLeft: '4px', padding: 0 }}
                title="Remove Button"
              >
                <i className="fa-solid fa-xmark" style={{ fontSize: '11px' }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
