"use client";

import React from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { ASTField } from '../types';

interface ToggleFieldProps {
  field: ASTField;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleField({ field, onChange, disabled = false }: ToggleFieldProps) {
  const isChecked = Boolean(field.value);

  return (
    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-4">
      <div className="flex flex-col min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white tracking-tight">{field.label}</span>
          {field.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
              {field.badge}
            </span>
          )}
        </div>
        {field.description && (
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{field.description}</p>
        )}
      </div>

      <Toggle
        checked={isChecked}
        onChange={onChange}
        disabled={disabled || field.disabled}
      />
    </div>
  );
}
