"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, disabled = false, label, description }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      {(label || description) && (
        <div className="flex flex-col min-w-0">
          {label && <span className="text-xs font-semibold text-white leading-snug">{label}</span>}
          {description && <span className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{description}</span>}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 p-0.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
          checked ? 'bg-red-600 shadow-[0_0_12px_rgba(225,29,46,0.5)]' : 'bg-zinc-800 border border-white/10'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className="w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}
