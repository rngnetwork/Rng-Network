'use client';

import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

export interface CheckMarkFieldProps {
  label: string;
  description?: string;
  value?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onChange?: (value: boolean) => void;
  onExecute?: () => void | Promise<void>;
  onCheck?: () => void;
  onCancel?: () => void;
  'aria-label'?: string;
}

export const CheckMarkField: React.FC<CheckMarkFieldProps> = ({
  label,
  description,
  disabled = false,
  loading = false,
  className = '',
  onChange,
  onExecute,
  onCheck,
  onCancel,
  'aria-label': ariaLabel,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const effectiveLoading = loading || internalLoading;

  const handleConfirm = async () => {
    if (disabled || effectiveLoading) return;
    if (onExecute) {
      try {
        setInternalLoading(true);
        await onExecute();
      } finally {
        setInternalLoading(false);
      }
    }
    if (onCheck) {
      onCheck();
    }
    if (onChange) {
      onChange(true);
    }
  };

  const handleCancel = () => {
    if (disabled || effectiveLoading) return;
    if (onCancel) {
      onCancel();
    }
    if (onChange) {
      onChange(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-apple-md bg-surface-canvas border border-surface-border ${className}`}
    >
      <div className="flex flex-col pr-4 min-w-0 flex-1">
        <span className="text-xs font-medium text-text-primary select-none leading-snug">
          {label}
        </span>
        {description && (
          <span className="text-[11px] text-text-tertiary leading-snug mt-0.5">
            {description}
          </span>
        )}
      </div>

      <div
        role="group"
        aria-label={ariaLabel || label}
        className={`inline-flex items-center rounded-full border border-white/10 overflow-hidden shrink-0 shadow-sm transition-opacity ${
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
        }`}
      >
        <button
          type="button"
          disabled={disabled || effectiveLoading}
          onClick={handleCancel}
          aria-label={`${label} - cancel`}
          title="Cancel / Idle"
          className="flex items-center justify-center px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-rose-400 transition-colors border-r border-white/10 cursor-pointer disabled:cursor-not-allowed"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          disabled={disabled || effectiveLoading}
          onClick={handleConfirm}
          aria-label={`${label} - execute`}
          title="Execute Action"
          className="flex items-center justify-center px-3 py-1.5 bg-brand-red hover:bg-brand-red/90 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {effectiveLoading ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : (
            <Check size={14} strokeWidth={2.5} className="text-emerald-400" />
          )}
        </button>
      </div>
    </div>
  );
};
