'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import type { EmbedField } from '@/lib/model/embed';

export interface ContainerFieldsProps {
  cIdx: number;
  fields?: EmbedField[];
  onAddField: (cIdx: number) => void;
  onUpdateField: (
    cIdx: number,
    fIdx: number,
    key: 'name' | 'value' | 'inline',
    val: string | boolean
  ) => void;
  onRemoveField: (cIdx: number, fIdx: number) => void;
}

export const ContainerFields: React.FC<ContainerFieldsProps> = ({
  cIdx,
  fields = [],
  onAddField,
  onUpdateField,
  onRemoveField,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400">
          Embed Fields ({fields.length}/25)
        </span>
      </div>

      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {fields.map((field, fIdx) => (
            <div
              key={field.id || `fld_${fIdx}`}
              className="p-3 rounded-apple-lg bg-surface-canvas border border-white/10 flex flex-col gap-2 shadow-apple-card"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={field.name}
                  placeholder="Field Name"
                  onChange={(e) =>
                    onUpdateField(cIdx, fIdx, 'name', e.target.value)
                  }
                  className="w-full bg-transparent text-xs font-bold text-white placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemoveField(cIdx, fIdx)}
                  title="Remove Field"
                  className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              <textarea
                value={field.value}
                placeholder="Field Value (Markdown)"
                onChange={(e) =>
                  onUpdateField(cIdx, fIdx, 'value', e.target.value)
                }
                rows={2}
                className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none resize-none"
              />

              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-400 select-none">
                <input
                  type="checkbox"
                  checked={Boolean(field.inline)}
                  onChange={(e) =>
                    onUpdateField(cIdx, fIdx, 'inline', e.target.checked)
                  }
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-red focus:ring-0"
                />
                <span>Inline</span>
              </label>
            </div>
          ))}
        </div>
      )}

      {fields.length < 25 && (
        <button
          type="button"
          onClick={() => onAddField(cIdx)}
          className="w-full py-2 px-3 rounded-apple-md border border-dashed border-white/15 hover:border-brand-red/40 bg-white/[0.02] hover:bg-brand-red/5 text-xs font-medium text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={13} className="text-brand-red" />
          <span>Add Field</span>
        </button>
      )}
    </div>
  );
};
