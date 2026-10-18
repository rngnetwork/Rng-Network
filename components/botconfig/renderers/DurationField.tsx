"use client";

import React, { useMemo } from 'react';
import { ASTField } from '../types';

interface DurationFieldProps {
  field: ASTField;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const UNITS = [
  { value: 's', label: 'Seconds' },
  { value: 'm', label: 'Minutes' },
  { value: 'h', label: 'Hours' },
  { value: 'd', label: 'Days' },
];

export function DurationField({ field, onChange, disabled = false }: DurationFieldProps) {
  const rawValue = String(field.value || '5m');

  const { amount, unit } = useMemo(() => {
    const match = rawValue.match(/^(\d+)([smhd])$/i);
    if (match) {
      return { amount: parseInt(match[1], 10), unit: match[2].toLowerCase() };
    }
    return { amount: 5, unit: 'm' };
  }, [rawValue]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const safeAmount = isNaN(val) ? 1 : Math.max(1, val);
    onChange(`${safeAmount}${unit}`);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    onChange(`${amount}${newUnit}`);
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
      </div>

      {field.description && (
        <p className="text-xs text-zinc-400 leading-relaxed -mt-1">{field.description}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={999}
          value={amount}
          disabled={disabled || field.disabled}
          onChange={handleAmountChange}
          className="w-24 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-red-500 text-white font-mono text-xs md:text-sm outline-none transition-all focus:shadow-[0_0_20px_rgba(225,29,46,0.25)] disabled:opacity-50 disabled:cursor-not-allowed text-center"
        />

        <div className="relative">
          <select
            value={unit}
            disabled={disabled || field.disabled}
            onChange={handleUnitChange}
            className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-red-500 text-white text-xs md:text-sm outline-none transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value} className="bg-[#111214] text-white">
                {u.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
