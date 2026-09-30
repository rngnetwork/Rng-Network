"use client";

import React from 'react';
import {
  DiscordInnerComponent,
  RadioOption,
  CheckboxOption
} from '../../types';

interface ModalComponentData {
  type: number;
  id?: string;
  label?: string;
  paragraph?: boolean;
  style?: number;
  placeholder?: string;
  description?: string;
  question?: string;
  checked?: boolean;
  options?: Array<{ label?: string; value?: string; selected?: boolean; checked?: boolean }>;
  [key: string]: unknown;
}

interface ModalComponentsEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordInnerComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordInnerComponent) => void;
}

export function ModalComponentsEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: ModalComponentsEditorProps) {
  const compData = comp as unknown as ModalComponentData;
  const type = compData.type;

  const handleUpdate = (patch: Record<string, unknown>) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, ...patch } as DiscordInnerComponent);
  };

  // Type 4: Text Input
  if (type === 4) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <input
            type="text"
            className="bare-input"
            style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}
            value={compData.label || 'Input Field'}
            placeholder="Field Label"
            onChange={(e) => handleUpdate({ label: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`btn-style-chip ${!compData.paragraph ? 'active' : ''}`}
              style={{ padding: '2px 6px', fontSize: '10px' }}
              onClick={() => handleUpdate({ paragraph: false, style: 1 })}
            >
              Short
            </button>
            <button
              type="button"
              className={`btn-style-chip ${compData.paragraph ? 'active' : ''}`}
              style={{ padding: '2px 6px', fontSize: '10px' }}
              onClick={() => handleUpdate({ paragraph: true, style: 2 })}
            >
              Paragraph
            </button>
          </div>
        </div>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '11.5px', background: '#1e1f22', padding: '6px 8px', borderRadius: '4px' }}
          value={compData.placeholder || ''}
          placeholder="Placeholder text..."
          onChange={(e) => handleUpdate({ placeholder: e.target.value })}
        />
      </div>
    );
  }

  // Type 18: Label Component
  if (type === 18) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff' }}
          value={compData.label || 'Form Section Label'}
          placeholder="Section Label"
          onChange={(e) => handleUpdate({ label: e.target.value })}
        />
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}
          value={compData.description || ''}
          placeholder="Help description..."
          onChange={(e) => handleUpdate({ description: e.target.value })}
        />
      </div>
    );
  }

  // Type 21: Radio Group
  if (type === 21) {
    const options = (compData.options || []) as RadioOption[];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}
          value={compData.label || 'Radio Options Group'}
          placeholder="Group Title"
          onChange={(e) => handleUpdate({ label: e.target.value })}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {options.map((opt: RadioOption, optIdx: number) => (
            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name={`rg_${compData.id || compIdx}`}
                checked={Boolean(opt.selected)}
                onChange={() => {
                  const updatedOpts = options.map((o: RadioOption, i: number) => ({ ...o, selected: i === optIdx }));
                  handleUpdate({ options: updatedOpts });
                }}
              />
              <input
                type="text"
                className="bare-input"
                style={{ flex: 1, fontSize: '11.5px' }}
                value={opt.label}
                onChange={(e) => {
                  const updatedOpts = [...options];
                  updatedOpts[optIdx] = { ...updatedOpts[optIdx], label: e.target.value };
                  handleUpdate({ options: updatedOpts });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Type 22: Checkbox Group
  if (type === 22) {
    const options = (compData.options || []) as CheckboxOption[];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}
          value={compData.question || 'Multi-choice Checkboxes'}
          placeholder="Question / Title"
          onChange={(e) => handleUpdate({ question: e.target.value })}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {options.map((opt: CheckboxOption, optIdx: number) => (
            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={Boolean(opt.checked)}
                onChange={(e) => {
                  const updatedOpts = [...options];
                  updatedOpts[optIdx] = { ...updatedOpts[optIdx], checked: e.target.checked };
                  handleUpdate({ options: updatedOpts });
                }}
              />
              <input
                type="text"
                className="bare-input"
                style={{ flex: 1, fontSize: '11.5px' }}
                value={opt.label}
                onChange={(e) => {
                  const updatedOpts = [...options];
                  updatedOpts[optIdx] = { ...updatedOpts[optIdx], label: e.target.value };
                  handleUpdate({ options: updatedOpts });
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Type 23: Single Checkbox
  if (type === 23) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={Boolean(compData.checked)}
          onChange={(e) => handleUpdate({ checked: e.target.checked })}
        />
        <input
          type="text"
          className="bare-input"
          style={{ flex: 1, fontSize: '12px' }}
          value={compData.label || 'Checkbox Toggle'}
          placeholder="Toggle Label"
          onChange={(e) => handleUpdate({ label: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
      Component Type {type}
    </div>
  );
}
