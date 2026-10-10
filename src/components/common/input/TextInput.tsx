import React from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onClear,
  id,
  disabled = false,
  className = '',
  value,
  ...rest
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const showClear = Boolean(onClear && value && !disabled);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary select-none">
          {label}
        </label>
      ) : null}
      <div
        className={`relative flex items-center w-full rounded-apple-md bg-[#0E0E12] border transition-all duration-150 ${
          error
            ? 'border-accent-danger ring-1 ring-accent-danger/30'
            : 'border-surface-border hover:border-white/20 focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-canvas' : ''}`}
      >
        {leftIcon ? (
          <span className="pl-3 pr-1 text-text-tertiary flex items-center pointer-events-none">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          disabled={disabled}
          value={value}
          className="w-full bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none disabled:cursor-not-allowed"
          {...rest}
        />
        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="p-1 mr-1 text-text-tertiary hover:text-text-primary rounded-full hover:bg-white/10 transition-colors"
            aria-label="Clear input"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
        {!showClear && rightIcon ? (
          <span className="pr-3 pl-1 text-text-tertiary flex items-center pointer-events-none">
            {rightIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <span className="text-xs text-accent-danger">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-text-tertiary">{helperText}</span>
      ) : null}
    </div>
  );
};
