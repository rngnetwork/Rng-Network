"use client";

import React from 'react';
import { DiscordSelectComponent, SelectOption } from '../../types';

interface SelectMenuEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordSelectComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordSelectComponent) => void;
}

export function SelectMenuEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: SelectMenuEditorProps) {
  const options = comp.options || [];

  const handleUpdate = (patch: Partial<DiscordSelectComponent>) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, ...patch });
  };

  const handleAddOption = () => {
    if (options.length >= 25) {
      alert('Discord String Select menus support a maximum of 25 options.');
      return;
    }
    const newOpt: SelectOption = {
      label: `Option ${options.length + 1}`,
      value: `opt_${Date.now()}`,
      description: '',
      emoji: '🔹',
      default: false
    };
    handleUpdate({ options: [...options, newOpt] });
  };

  const handleUpdateOption = (optIdx: number, patch: Partial<SelectOption>) => {
    const updOptions = [...options];
    updOptions[optIdx] = { ...updOptions[optIdx], ...patch };
    handleUpdate({ options: updOptions });
  };

  const handleRemoveOption = (optIdx: number) => {
    if (options.length <= 1) {
      alert('A Select Menu must contain at least 1 option.');
      return;
    }
    const updOptions = [...options];
    updOptions.splice(optIdx, 1);
    handleUpdate({ options: updOptions });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>Placeholder Text</label>
          <input
            type="text"
            className="bare-input"
            style={{ fontSize: '12px', background: '#1e1f22', padding: '6px 8px', borderRadius: '4px' }}
            value={comp.placeholder || ''}
            placeholder="Choose an option..."
            onChange={(e) => handleUpdate({ placeholder: e.target.value })}
          />
        </div>
        <div>
          <label style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>Custom ID</label>
          <input
            type="text"
            className="bare-input"
            style={{ fontSize: '12px', background: '#1e1f22', padding: '6px 8px', borderRadius: '4px' }}
            value={comp.custom_id || ''}
            placeholder="select_menu_id"
            onChange={(e) => handleUpdate({ custom_id: e.target.value })}
          />
        </div>
      </div>

      {comp.type === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
              Menu Options ({options.length}/25)
            </span>
            {options.length < 25 && (
              <button
                type="button"
                className="btn-add-option-pill"
                onClick={handleAddOption}
              >
                <i className="fa-solid fa-plus" /> Add Option
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {options.map((opt, optIdx) => {
              const emojiDisplay = typeof opt.emoji === 'object' ? opt.emoji.name : (opt.emoji || '🔹');

              return (
                <div
                  key={optIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1e1f22',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  <input
                    type="text"
                    style={{ width: '32px', textAlign: 'center', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px' }}
                    value={emojiDisplay}
                    onChange={(e) => handleUpdateOption(optIdx, { emoji: e.target.value })}
                    title="Emoji"
                  />
                  <input
                    type="text"
                    className="bare-input"
                    style={{ flex: 1, fontSize: '12px', fontWeight: 600 }}
                    value={opt.label}
                    placeholder="Option Label"
                    onChange={(e) => handleUpdateOption(optIdx, { label: e.target.value })}
                  />
                  <input
                    type="text"
                    className="bare-input"
                    style={{ flex: 1, fontSize: '11px', color: 'var(--discord-text-muted)' }}
                    value={opt.description || ''}
                    placeholder="Subtext description..."
                    onChange={(e) => handleUpdateOption(optIdx, { description: e.target.value })}
                  />
                  <button
                    type="button"
                    className="comp-tool-btn btn-del"
                    style={{ width: '20px', height: '20px' }}
                    onClick={() => handleRemoveOption(optIdx)}
                    title="Remove Option"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
