"use client";

import React from 'react';
import { EmbedField } from '../../types';

interface ContainerFieldsProps {
  cIdx: number;
  fields?: EmbedField[];
  onAddField: (cIdx: number) => void;
  onUpdateField: (cIdx: number, fIdx: number, key: 'name' | 'value' | 'inline', val: any) => void;
  onRemoveField: (cIdx: number, fIdx: number) => void;
}

export function ContainerFields({
  cIdx,
  fields = [],
  onAddField,
  onUpdateField,
  onRemoveField
}: ContainerFieldsProps) {
  if (fields.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>Fields (0/25)</span>
        <button
          type="button"
          className="btn-add-option-pill"
          onClick={() => onAddField(cIdx)}
        >
          <i className="fa-solid fa-plus" /> Add Field
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>Fields ({fields.length}/25)</span>
        {fields.length < 25 && (
          <button
            type="button"
            className="btn-add-option-pill"
            onClick={() => onAddField(cIdx)}
          >
            <i className="fa-solid fa-plus" /> Add Field
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
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

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: 'var(--discord-text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={f.inline !== false}
                onChange={(e) => onUpdateField(cIdx, fIdx, 'inline', e.target.checked)}
              />
              <span>Inline Field</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
