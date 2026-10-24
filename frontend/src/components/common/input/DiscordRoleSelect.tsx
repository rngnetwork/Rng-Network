'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DiscordRoleOption {
  id: string;
  name: string;
  color?: string | number;
  position?: number;
  assignableByBot?: boolean;
}

export interface DiscordRoleSelectProps {
  value?: string | null;
  onChange: (roleId: string | null) => void;
  roles?: DiscordRoleOption[];
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

function resolveHexColor(color?: string | number): string | null {
  if (color === undefined || color === null || color === 0 || color === '0') {
    return null;
  }
  if (typeof color === 'string') {
    if (color.startsWith('#')) return color;
    const num = parseInt(color, 10);
    if (!isNaN(num) && num > 0) {
      return `#${num.toString(16).padStart(6, '0')}`;
    }
    return color;
  }
  if (typeof color === 'number' && color > 0) {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
  return null;
}

export const DiscordRoleSelect: React.FC<DiscordRoleSelectProps> = ({
  value,
  onChange,
  roles = [],
  disabled = false,
  label,
  placeholder = 'Select a role...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const selectedRole = roles.find((r) => r.id === value);
  const isDeletedRole = Boolean(value && !selectedRole);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (roleId: string | null) => {
    onChange(roleId);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const selectedHexColor = resolveHexColor(selectedRole?.color);

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 w-full ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary select-none">
          {label}
        </span>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={label || placeholder}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`flex items-center justify-between w-full min-h-[38px] px-3 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-left transition-colors duration-150 ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-900/60'
            : 'hover:border-zinc-700 focus:outline-none focus:border-brand-red/50 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedRole ? (
            <>
              {selectedHexColor ? (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedHexColor }}
                />
              ) : null}
              <span className="text-text-primary font-medium truncate">
                {selectedRole.name}
              </span>
            </>
          ) : isDeletedRole ? (
            <span className="text-zinc-400 font-mono text-[11px] truncate">
              Deleted Role (ID: {value})
            </span>
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-400 shrink-0 ml-2 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label || 'Discord roles list'}
          className="absolute top-full left-0 z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-apple-md bg-zinc-900 border border-surface-border shadow-elevated py-1"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect(null)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors duration-100 text-left cursor-pointer"
          >
            <span>None (Unset)</span>
            {!value ? <Check size={12} className="text-brand-red" /> : null}
          </button>

          {roles.map((role) => {
            const isSelected = role.id === value;
            const hex = resolveHexColor(role.color);

            return (
              <button
                key={role.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(role.id)}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-zinc-800/60 transition-colors duration-100 text-left cursor-pointer ${
                  isSelected ? 'text-white font-medium bg-zinc-800/40' : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {hex ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-zinc-600" />
                  )}
                  <span className="truncate">{role.name}</span>
                </div>
                {isSelected ? <Check size={12} className="text-brand-red shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
