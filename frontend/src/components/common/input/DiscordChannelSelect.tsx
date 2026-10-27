'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Hash } from 'lucide-react';

export interface DiscordChannelOption {
  id: string;
  name: string;
  type?: number;
}

export interface DiscordChannelSelectProps {
  value?: string | null;
  onChange: (channelId: string | null) => void;
  channels?: DiscordChannelOption[];
  disabled?: boolean;
  isNetworkDeck?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const DiscordChannelSelect: React.FC<DiscordChannelSelectProps> = ({
  value,
  onChange,
  channels = [],
  disabled = false,
  isNetworkDeck = false,
  label,
  placeholder = 'None (Unset)',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const selectedChannel = channels.find((c) => c.id === value);
  const isDeletedChannel = Boolean(value && !selectedChannel);

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

  const handleSelect = (channelId: string | null) => {
    onChange(channelId);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  if (isNetworkDeck) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label ? (
          <span className="text-xs font-medium text-text-secondary select-none">
            {label}
          </span>
        ) : null}
        <div className="flex items-center w-full min-h-[38px] px-3 py-1.5 rounded-apple-md bg-zinc-900/60 border border-surface-border text-xs text-zinc-500 cursor-not-allowed">
          <span>Channel assignments are server-specific and configured per server</span>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-1.5 truncate">
          <Hash size={13} className="text-zinc-500 shrink-0" />
          {selectedChannel ? (
            <span className="text-text-primary font-medium truncate">
              {selectedChannel.name}
            </span>
          ) : isDeletedChannel ? (
            <span className="text-zinc-400 font-mono text-[11px] truncate">
              Deleted Channel (ID: {value})
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
          aria-label={label || 'Discord channels list'}
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

          {channels.map((channel) => {
            const isSelected = channel.id === value;

            return (
              <button
                key={channel.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(channel.id)}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-zinc-800/60 transition-colors duration-100 text-left cursor-pointer ${
                  isSelected ? 'text-white font-medium bg-zinc-800/40' : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Hash size={12} className="text-zinc-500 shrink-0" />
                  <span className="truncate">{channel.name}</span>
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
