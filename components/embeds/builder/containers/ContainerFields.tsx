"use client";

import React from 'react';
import { EmbedField } from '../../types';

interface ContainerFieldsProps {
  cIdx: number;
  fields?: EmbedField[];
  onAddField: (cIdx: number) => void;
  onUpdateField: (cIdx: number, fIdx: number, key: 'name' | 'value' | 'inline', val: string | boolean) => void;
  onRemoveField: (cIdx: number, fIdx: number) => void;
}

export function ContainerFields({
  cIdx,
  fields = [],
  onAddField,
  onUpdateField,
  onRemoveField
}: ContainerFieldsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Fields Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
          Fields ({fields.length}/25)
        </span>
      </div>

      {/* 2. Horizontally Stacked Fields Grid (Rendered on top of the spanned Add Field button) */}
      {fields.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
          {fields.map((f, fIdx) => (
            <div
              key={f.id || fIdx}
              style={{
                background: '#191a1d',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '4px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  type="text"
                  className="bare-input"
                  style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff' }}
                  value={f.name}
                  placeholder="Field Name"
                  onChange={(e) => onUpdateField(cIdx, fIdx, 'name', e.target.value)}
                />
                <button
                  type="button"
                  className="comp-tool-btn btn-del"
                  style={{ width: '18px', height: '18px' }}
                  onClick={() => onRemoveField(cIdx, fIdx)}
                  title="Remove Field"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <textarea
                className="bare-input"
                style={{ fontSize: '11px', color: '#dbdee1', minHeight: '36px', resize: 'vertical' }}
                value={f.value}
                placeholder="Field Value (Markdown)"
                onChange={(e) => onUpdateField(cIdx, fIdx, 'value', e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* 3. Spanned Add Field Button (Full Width, positioned below the fields) */}
      {fields.length < 25 && (
        <button
          type="button"
          onClick={() => onAddField(cIdx)}
          style={{
            width: '100%',
            padding: '7px 12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: 'var(--discord-text-muted)',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = 'var(--discord-text-muted)';
          }}
          title="Add a custom Embed Field"
        >
          <i className="fa-solid fa-plus" /> Add Field
        </button>
      )}
    </div>
  );
}
