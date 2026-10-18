"use client";

import React from 'react';
import { ASTField } from '../types';

interface TextareaFieldProps {
  field: ASTField;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextareaField({ field, onChange, disabled = false }: TextareaFieldProps) {
  const value = field.value ?? '';
  const max = field.validation?.max;

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
        {max && (
          <span className="text-[11px] font-mono text-zinc-500">
            {String(value).length}/{max}
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-zinc-400 leading-relaxed -mt-1">{field.description}</p>
      )}

      <textarea
        value={value}
        rows={3}
        maxLength={max}
        disabled={disabled || field.disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || 'Enter template content...'}
        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-red-500 text-white text-xs md:text-sm outline-none transition-all placeholder:text-zinc-600 resize-none focus:shadow-[0_0_20px_rgba(225,29,46,0.25)] disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
      />
    </div>
  );
}
