'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface DropdownOption<T = string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Dropdown<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  searchable = false,
  disabled = false,
  className = '',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const openMenu = () => {
    if (disabled) return;
    const activeIdx = filteredOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(activeIdx >= 0 ? activeIdx : 0);
    setIsOpen(true);
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      openMenu();
    } else {
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`} ref={dropdownRef}>
      {label ? (
        <span id={`label-${dropdownId}`} className="text-xs font-medium text-text-secondary select-none">
          {label}
        </span>
      ) : null}
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `label-${dropdownId}` : undefined}
          disabled={disabled}
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-apple-md bg-[#0E0E12] border transition-all duration-150 select-none outline-none ${
            error
              ? 'border-accent-danger ring-1 ring-accent-danger/30'
              : isOpen
              ? 'border-brand-red ring-2 ring-brand-red/20'
              : 'border-surface-border hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-canvas' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon ? (
              <span className="flex-shrink-0 text-text-secondary">{selectedOption.icon}</span>
            ) : null}
            <span className={selectedOption ? 'text-text-primary' : 'text-text-tertiary'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-text-tertiary transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-brand-red' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen ? (
          <div
            role="listbox"
            tabIndex={-1}
            className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-apple-md bg-surface-elevated border border-surface-border shadow-elevated backdrop-blur-md z-50 p-1 flex flex-col gap-0.5"
          >
            {searchable ? (
              <div className="p-1.5 sticky top-0 bg-surface-elevated/95 backdrop-blur-sm border-b border-surface-border/50">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2.5 py-1 text-xs rounded-apple-sm bg-surface-canvas border border-surface-border text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-red"
                  onKeyDown={handleKeyDown}
                />
              </div>
            ) : null}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-tertiary text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${String(opt.value)}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-apple-sm text-left transition-colors select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-text-tertiary'
                        : isSelected
                        ? 'bg-brand-red/15 text-brand-red font-medium'
                        : isHighlighted
                        ? 'bg-white/[0.08] text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon ? (
                        <span className="flex-shrink-0 text-current">{opt.icon}</span>
                      ) : null}
                      <div className="flex flex-col truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.description ? (
                          <span className="text-[10px] text-text-tertiary truncate">
                            {opt.description}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {isSelected ? (
                      <svg
                        className="w-3.5 h-3.5 text-brand-red flex-shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs text-accent-danger">{error}</span> : null}
    </div>
  );
}
