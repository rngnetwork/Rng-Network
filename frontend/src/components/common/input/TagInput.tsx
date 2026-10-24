'use client';

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  maxTags?: number;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  disabled = false,
  label,
  maxTags = 100,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTags = (rawInput: string) => {
    if (!rawInput) return;

    const tokens = rawInput
      .split(',')
      .map((t) => t.trim().replace(/^,+|,+$/g, ''))
      .filter((t) => t.length > 0);

    if (tokens.length === 0) return;

    const updated = [...value];
    for (const token of tokens) {
      if (updated.length >= maxTags) break;
      const exists = updated.some(
        (t) => t.toLowerCase() === token.toLowerCase()
      );
      if (!exists) {
        updated.push(token);
      }
    }

    if (updated.length !== value.length) {
      onChange(updated);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTags(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes(',')) {
      e.preventDefault();
      addTags(pastedText);
    }
  };

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary select-none">
          {label}
        </span>
      ) : null}
      <div
        onClick={handleContainerClick}
        className={`flex flex-wrap items-center gap-1.5 min-h-[38px] p-1.5 rounded-apple-md bg-zinc-900 border border-surface-border transition-colors duration-150 ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-900/60'
            : 'focus-within:border-brand-red/50 cursor-text'
        }`}
      >
        {value.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-apple-sm bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-200 select-none"
          >
            <span className="truncate max-w-[180px]">{tag}</span>
            {!disabled ? (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(idx);
                }}
                className="text-zinc-400 hover:text-white transition-colors duration-100 rounded-apple-sm p-0.5 focus:outline-none cursor-pointer"
              >
                <X size={12} />
              </button>
            ) : null}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={disabled || value.length >= maxTags}
          aria-label={label || placeholder}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed py-1 px-1"
        />
      </div>
    </div>
  );
};
