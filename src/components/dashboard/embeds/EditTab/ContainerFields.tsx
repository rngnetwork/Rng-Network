'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import type { EmbedField } from '@/lib/model/embed';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';

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
                <TextInput
                  value={field.name}
                  placeholder="Field Name"
                  onChange={(e) =>
                    onUpdateField(cIdx, fIdx, 'name', e.target.value)
                  }
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => onRemoveField(cIdx, fIdx)}
                  title="Remove Field"
                  className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                >
                  <X size={14} />
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
            </div>
          ))}
        </div>
      )}

      {fields.length < 25 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAddField(cIdx)}
          leftIcon={<Plus size={13} className="text-brand-red" />}
          className="w-full border-dashed border-white/15 hover:border-brand-red/40 bg-white/[0.02] hover:bg-brand-red/5 text-zinc-400 hover:text-white"
        >
          Add Field
        </Button>
      )}
    </div>
  );
};
