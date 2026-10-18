"use client";

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { ASTField } from '../types';

interface NumberStepperFieldProps {
  field: ASTField;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function NumberStepperField({ field, onChange, disabled = false }: NumberStepperFieldProps) {
  const min = field.validation?.min ?? 0;
  const max = field.validation?.max ?? 999999;
  const value = typeof field.value === 'number' ? field.value : Number(field.value) || min;

  const handleDecrement = () => {
    if (disabled || field.disabled) return;
    const next = Math.max(min, value - 1);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled || field.disabled) return;
    const next = Math.min(max, value + 1);
    onChange(next);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

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
        <span className="text-[11px] font-mono text-zinc-500">
          Range: {min} - {max}
        </span>
      </div>

      {field.description && (
        <p className="text-xs text-zinc-400 leading-relaxed -mt-1">{field.description}</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1 focus-within:border-red-500 transition-all focus-within:shadow-[0_0_20px_rgba(225,29,46,0.25)]">
          <button
            type="button"
            disabled={disabled || field.disabled || value <= min}
            onClick={handleDecrement}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-300 hover:text-white transition-all"
            aria-label="Decrease value"
          >
            <Minus size={14} />
          </button>

          <input
            type="number"
            min={min}
            max={max}
            value={value}
            disabled={disabled || field.disabled}
            onChange={handleManualChange}
            className="w-16 text-center bg-transparent text-white font-mono text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            disabled={disabled || field.disabled || value >= max}
            onClick={handleIncrement}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-zinc-300 hover:text-white transition-all"
            aria-label="Increase value"
          >
            <Plus size={14} />
          </button>
        </div>

        {field.unit && (
          <span className="text-xs text-zinc-400 font-mono">
            {field.unit}
          </span>
        )}
      </div>
    </div>
  );
}
