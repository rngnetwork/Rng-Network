import React from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  error,
  checked = false,
  disabled = false,
  onChange,
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={inputId}
        className={`inline-flex items-start gap-2.5 select-none cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className="relative flex items-center justify-center mt-0.5">
          <input
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            readOnly={!onChange}
            className="sr-only peer"
            {...rest}
          />
          <span
            className={`w-4 h-4 rounded-apple-sm flex items-center justify-center transition-all duration-150 border ${
              checked
                ? 'bg-brand-red border-brand-red text-white shadow-sm shadow-brand-red/25'
                : 'bg-surface-elevated border-surface-border text-transparent hover:border-white/20'
            } peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-canvas`}
          >
            <svg
              className={`w-3 h-3 transition-transform duration-150 ${
                checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
            </svg>
          </span>
        </span>
        {label ? (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-text-primary leading-tight">{label}</span>
            {description ? (
              <span className="text-xs text-text-secondary mt-0.5">{description}</span>
            ) : null}
          </div>
        ) : null}
      </label>
      {error ? <span className="text-xs text-accent-danger ml-6">{error}</span> : null}
    </div>
  );
};
