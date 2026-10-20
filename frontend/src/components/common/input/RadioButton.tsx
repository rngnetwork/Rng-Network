import React from 'react';

export interface RadioButtonProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  description,
  checked = false,
  disabled = false,
  onChange,
  className = '',
  id,
  name,
  value,
  ...rest
}) => {
  const inputId =
    id ||
    (label ? `rb-${label.toLowerCase().replace(/\s+/g, '-')}-${String(value || '')}` : undefined);

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-start gap-2.5 select-none cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <span className="relative flex items-center justify-center mt-0.5">
        <input
          id={inputId}
          name={name}
          type="radio"
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only peer"
          {...rest}
        />
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 border ${
            checked
              ? 'border-brand-red bg-surface-canvas shadow-sm shadow-brand-red/25'
              : 'border-surface-border bg-surface-elevated hover:border-white/20'
          } peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-canvas`}
        >
          <span
            className={`w-2 h-2 rounded-full bg-brand-red transition-transform duration-150 ${
              checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          />
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
  );
};
