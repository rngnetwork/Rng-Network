"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}

export interface GlassmorphicDropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export function GlassmorphicDropdown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search options...",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  size = "md",
  id
}: GlassmorphicDropdownProps<T>) {
  const generatedId = useId();
  const dropdownId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchable, searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
      case "Tab":
        setIsOpen(false);
        setSearchQuery("");
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next].disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length &&
          !filteredOptions[highlightedIndex].disabled
        ) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearchQuery("");
        }
        break;
    }
  };

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs rounded-lg min-h-[34px]",
    md: "py-2 px-3.5 text-sm rounded-xl min-h-[42px]",
    lg: "py-3 px-4 text-base rounded-2xl min-h-[50px]"
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={dropdownId}
          className="block mb-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group w-full flex items-center justify-between gap-3 text-left transition-all duration-200 outline-none
          ${sizeClasses}
          ${
            disabled
              ? "opacity-40 cursor-not-allowed bg-black/40 border border-white/5 text-zinc-500"
              : "cursor-pointer bg-[#0e0f12]/80 hover:bg-[#16171d]/90 active:bg-[#1a1b22] border border-white/10 hover:border-white/20 focus:border-[#E11D2E]/80 focus:ring-2 focus:ring-[#E11D2E]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          }
          ${isOpen ? "border-[#E11D2E]/80 ring-2 ring-[#E11D2E]/20" : ""}
          ${triggerClassName}
        `}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-zinc-400 group-hover:text-white transition-colors">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={`truncate font-medium ${
              selectedOption ? "text-white" : "text-zinc-500"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-mono rounded bg-white/10 text-zinc-300 border border-white/10">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-zinc-400 group-hover:text-white transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#E11D2E]" : ""
          }`}
        />
      </button>

      {/* Floating Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-white/15 bg-[#0d0e12]/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(225,29,46,0.15)] overflow-hidden flex flex-col ${menuClassName}`}
          >
            {/* Search Filter Header */}
            {searchable && (
              <div className="p-2 border-b border-white/10 bg-white/[0.02]">
                <div className="relative flex items-center">
                  <Search
                    size={14}
                    className="absolute left-2.5 text-zinc-500 pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-[#E11D2E]/60 focus:bg-white/10 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Listbox */}
            <ul
              ref={listboxRef}
              role="listbox"
              tabIndex={-1}
              className="max-h-56 overflow-y-auto p-1.5 flex flex-col gap-0.5 divide-y-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-zinc-500 font-mono">
                  No matching options found
                </li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <li
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`group relative flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 select-none
                        ${
                          opt.disabled
                            ? "opacity-35 cursor-not-allowed text-zinc-600"
                            : "cursor-pointer"
                        }
                        ${
                          isSelected
                            ? "bg-[#E11D2E]/15 text-white font-medium border border-[#E11D2E]/30"
                            : isHighlighted
                            ? "bg-white/10 text-white"
                            : "text-zinc-300 hover:text-white hover:bg-white/5"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {opt.icon && (
                          <span
                            className={`flex-shrink-0 transition-colors ${
                              isSelected
                                ? "text-[#E11D2E]"
                                : "text-zinc-400 group-hover:text-zinc-200"
                            }`}
                          >
                            {opt.icon}
                          </span>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[11px] text-zinc-500 truncate group-hover:text-zinc-400">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {opt.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/5 text-zinc-400 border border-white/5">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check
                            size={14}
                            className="text-[#E11D2E] animate-in fade-in zoom-in-75 duration-150"
                          />
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
export default GlassmorphicDropdown;
