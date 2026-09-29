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

  const handleShiftLeft = (e: React.MouseEvent, bIdx: number) => {
    e.stopPropagation();
    if (bIdx <= 0) return;
    const updatedItems = [...items];
    const temp = updatedItems[bIdx - 1];
    updatedItems[bIdx - 1] = updatedItems[bIdx];
    updatedItems[bIdx] = temp;
    onUpdateComponent(cIdx, compIdx, {
      ...comp,
      items: updatedItems
    });
  };

  const handleShiftRight = (e: React.MouseEvent, bIdx: number) => {
    e.stopPropagation();
    if (bIdx >= items.length - 1) return;
    const updatedItems = [...items];
    const temp = updatedItems[bIdx + 1];
    updatedItems[bIdx + 1] = updatedItems[bIdx];
    updatedItems[bIdx] = temp;
    onUpdateComponent(cIdx, compIdx, {
      ...comp,
      items: updatedItems
    });
  };

  const handleLabelChange = (bIdx: number, newLabel: string) => {
    const updatedItems = [...items];
    const targetItem = updatedItems[bIdx];
    if (targetItem && targetItem.type === 2) {
      updatedItems[bIdx] = {
        ...targetItem,
        label: newLabel
      };
      onUpdateComponent(cIdx, compIdx, {
        ...comp,
        items: updatedItems
      });
    }
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '4px',
                userSelect: 'none'
              }}
            >
              {/* Shift Left */}
              <button
                type="button"
                disabled={bIdx === 0}
                onClick={(e) => handleShiftLeft(e, bIdx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: bIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                  cursor: bIdx === 0 ? 'default' : 'pointer',
                  padding: '2px 3px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Shift Left"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>

              {/* Shift Right */}
              <button
                type="button"
                disabled={bIdx === items.length - 1}
                onClick={(e) => handleShiftRight(e, bIdx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: bIdx === items.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                  cursor: bIdx === items.length - 1 ? 'default' : 'pointer',
                  padding: '2px 3px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Shift Right"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>

              {/* Emoji if present */}
              {emojiDisplay && <span style={{ fontSize: '14px', lineHeight: 1 }}>{emojiDisplay}</span>}

              {/* Inline Label Editing */}
              <input
                type="text"
                value={btn.label || ''}
                placeholder="Button"
                onChange={(e) => handleLabelChange(bIdx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '3px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  width: `${Math.max(60, ((btn.label || 'Button').length + 2) * 8)}px`,
                  maxWidth: '160px',
                  outline: 'none'
                }}
                title="Edit button text inline"
              />

              {btn.style === 5 && <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px', opacity: 0.8 }} />}

              {/* Settings Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenButtonModal(cIdx, comp.id || `row_${compIdx}`, bIdx, btn);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Button Settings (Style, ID, Link, Emoji)"
              >
                <i className="fa-solid fa-gear" />
              </button>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => handleRemoveButton(e, bIdx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Remove Button"
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
