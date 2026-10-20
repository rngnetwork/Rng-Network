'use client';

import React, { useState, useRef, useEffect } from 'react';

export const DEFAULT_COLOR_PRESETS = [
  '#E11D2E', // RNG Crimson
  '#5865F2', // Discord Blurple
  '#57F287', // Green
  '#FEE75C', // Gold
  '#ED4245', // Danger
  '#1E1F22', // Obsidian
  '#FFFFFF', // White
];

export const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{6})$/;

export function hexToInt(hex: string): number {
  const sanitized = hex.replace('#', '').trim();
  if (!HEX_COLOR_REGEX.test(sanitized)) {
    return 14753070; // #E11D2E default integer
  }
  const parsed = parseInt(sanitized, 16);
  return Math.max(0, Math.min(16777215, parsed));
}

export function intToHex(colorInt: number): string {
  const bounded = Math.max(0, Math.min(16777215, colorInt));
  return `#${bounded.toString(16).padStart(6, '0').toUpperCase()}`;
}

export interface ColorPickerProps {
  color: string;
  onChange: (hex: string, integerColor: number) => void;
  label?: string;
  presets?: string[];
  disabled?: boolean;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
  presets = DEFAULT_COLOR_PRESETS,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevColor, setPrevColor] = useState(color);

  if (prevColor !== color) {
    setPrevColor(color);
    setHexInput(color);
    setError(null);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyColor = (newHex: string) => {
    const formatted = newHex.startsWith('#') ? newHex : `#${newHex}`;
    if (HEX_COLOR_REGEX.test(formatted)) {
      setError(null);
      setHexInput(formatted.toUpperCase());
      const intVal = hexToInt(formatted);
      onChange(formatted.toUpperCase(), intVal);
    } else {
      setError('Invalid hex code (must be 6 hex characters)');
    }
  };

  const handleBlur = () => {
    const formatted = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (!HEX_COLOR_REGEX.test(formatted)) {
      setError('Invalid hex. Resetting to #E11D2E.');
      handleApplyColor('#E11D2E');
    } else {
      handleApplyColor(formatted);
    }
  };

  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropperConstructor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
        const dropper = new eyeDropperConstructor();
        const result = await dropper.open();
        if (result?.sRGBHex) {
          handleApplyColor(result.sRGBHex);
        }
      } catch {
        // Cancelled or unsupported
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={containerRef}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary select-none">{label}</span>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-label={label ? `${label} - Open color picker` : 'Open color picker'}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-apple-md bg-[#0E0E12] border border-surface-border transition-all duration-150 select-none outline-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/20'
          }`}
        >
          <span
            className="w-5 h-5 rounded-apple-sm border border-white/20 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-xs text-text-primary uppercase">{color}</span>
        </button>

        {typeof window !== 'undefined' && 'EyeDropper' in window ? (
          <button
            type="button"
            disabled={disabled}
            onClick={handleEyeDropper}
            title="Sample screen color"
            className="p-2 rounded-apple-md bg-surface-elevated border border-surface-border text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M2 22l5.5-5.5M17 3l4 4-10 10-4-4L17 3z" />
            </svg>
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="absolute top-full mt-2 left-0 z-50 p-3 rounded-apple-md bg-surface-elevated border border-surface-border shadow-elevated backdrop-blur-md flex flex-col gap-3 min-w-[220px]">
          <div>
            <span className="text-[11px] font-medium text-text-secondary">Presets</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyColor(preset)}
                  className={`w-6 h-6 rounded-apple-sm border transition-transform hover:scale-110 active:scale-95 ${
                    color.toUpperCase() === preset.toUpperCase()
                      ? 'border-white ring-2 ring-brand-red ring-offset-1 ring-offset-surface-elevated'
                      : 'border-white/10'
                  }`}
                  style={{ backgroundColor: preset }}
                  aria-label={`Preset ${preset}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-surface-border">
            <span className="text-[11px] font-medium text-text-secondary">Custom Hex</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color.startsWith('#') ? color : `#${color}`}
                onChange={(e) => handleApplyColor(e.target.value)}
                className="w-7 h-7 rounded-apple-sm cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  if (HEX_COLOR_REGEX.test(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)) {
                    setError(null);
                  }
                }}
                onBlur={handleBlur}
                className="w-full px-2 py-1 text-xs font-mono uppercase rounded-apple-sm bg-surface-canvas border border-surface-border text-text-primary outline-none focus:border-brand-red"
                placeholder="#E11D2E"
              />
            </div>
            {error ? <span className="text-[10px] text-accent-danger mt-0.5">{error}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
