"use client";

import React from 'react';
import { GlassmorphicDropdown, DropdownOption } from '@/components/ui/GlassmorphicDropdown';
import { ASTField } from '../types';

interface DropdownFieldProps {
  field: ASTField;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function DropdownField({ field, onChange, disabled = false }: DropdownFieldProps) {
  const options: DropdownOption<any>[] = (field.options || []).map((opt) => ({
    value: opt.value,
    label: opt.label,
    description: opt.description,
    badge: opt.badge,
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          {field.label}
          {field.validation?.required && <span className="text-red-400">*</span>}
          {field.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              {field.badge}
            </span>
          )}
        </label>
      </div>

      {field.description && (
        <p className="text-xs text-zinc-400 leading-relaxed -mt-1">{field.description}</p>
      )}

      <GlassmorphicDropdown
        options={options}
        value={field.value}
        onChange={onChange}
        disabled={disabled || field.disabled}
        placeholder={field.placeholder || 'Select option...'}
        searchable={options.length > 5}
      />
    </div>
  );
}
