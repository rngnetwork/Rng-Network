"use client";

import React from 'react';

interface ModalComponentsEditorProps {
  cIdx: number;
  compIdx: number;
  comp: any;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: any) => void;
}

export function ModalComponentsEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: ModalComponentsEditorProps) {
  const type = comp.type;

  const handleUpdate = (patch: Record<string, any>) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, ...patch });
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
            value={comp.label || 'Input Field'}
            placeholder="Field Label"
            onChange={(e) => handleUpdate({ label: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`btn-style-chip ${!comp.paragraph ? 'active' : ''}`}
              style={{ padding: '2px 6px', fontSize: '10px' }}
              onClick={() => handleUpdate({ paragraph: false, style: 1 })}
            >
              Short
            </button>
            <button
              type="button"
              className={`btn-style-chip ${comp.paragraph ? 'active' : ''}`}
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
          value={comp.placeholder || ''}
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
          value={comp.label || 'Form Section Label'}
          placeholder="Section Label"
          onChange={(e) => handleUpdate({ label: e.target.value })}
        />
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}
          value={comp.description || ''}
          placeholder="Help description..."
          onChange={(e) => handleUpdate({ description: e.target.value })}
        />
      </div>
    );
  }

  // Type 21: Radio Group
  if (type === 21) {
    const options = comp.options || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}
          value={comp.label || 'Radio Options Group'}
          placeholder="Group Title"
          onChange={(e) => handleUpdate({ label: e.target.value })}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {options.map((opt: any, optIdx: number) => (
            <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name={`rg_${comp.id || compIdx}`}
                checked={Boolean(opt.selected)}
                onChange={() => {
                  const updatedOpts = options.map((o: any, i: number) => ({ ...o, selected: i === optIdx }));
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
    const options = comp.options || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}
          value={comp.question || 'Multi-choice Checkboxes'}
          placeholder="Question / Title"
          onChange={(e) => handleUpdate({ question: e.target.value })}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {options.map((opt: any, optIdx: number) => (
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
          checked={Boolean(comp.checked)}
          onChange={(e) => handleUpdate({ checked: e.target.checked })}
        />
        <input
          type="text"
          className="bare-input"
          style={{ flex: 1, fontSize: '12px' }}
          value={comp.label || 'Checkbox Toggle'}
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
