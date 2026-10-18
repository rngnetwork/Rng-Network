"use client";

import React, { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { ASTField } from '../types';

interface KeyValueListFieldProps {
  field: ASTField;
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function KeyValueListField({ field, onChange, disabled = false }: KeyValueListFieldProps) {
  const items: string[] = Array.isArray(field.value) ? field.value : [];
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setNewItem('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          {field.label}
          {field.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              {field.badge}
            </span>
          )}
        </label>
        <span className="text-[11px] font-mono text-zinc-500">{items.length} items</span>
      </div>

      {field.description && (
        <p className="text-xs text-zinc-400 leading-relaxed -mt-1">{field.description}</p>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={newItem}
            disabled={disabled || field.disabled}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder || 'Type item and press Enter...'}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-red-500 text-white text-xs md:text-sm outline-none transition-all placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(225,29,46,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          disabled={disabled || field.disabled || !newItem.trim()}
          onClick={handleAdd}
          className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>

      {/* Tag badges */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 p-3 rounded-xl bg-black/20 border border-white/5">
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-200"
            >
              <Tag size={12} className="text-red-400 shrink-0" />
              <span>{item}</span>
              {!disabled && !field.disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="hover:text-red-400 p-0.5 ml-0.5"
                  aria-label="Remove item"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
