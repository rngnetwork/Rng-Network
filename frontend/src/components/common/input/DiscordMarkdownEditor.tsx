'use client';

import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  EyeOff,
  Link as LinkIcon,
  Type,
  Eye,
  Edit3,
} from 'lucide-react';
import { DiscordMarkdown } from '../display/DiscordMarkdown';

export interface DiscordMarkdownEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  className?: string;
}

export const DiscordMarkdownEditor: React.FC<DiscordMarkdownEditorProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Type markdown text (e.g. **bold**, *italic*, ||spoiler||, [link](url))...',
  helperText,
  rows = 3,
  className = '',
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const normalizedValue =
    typeof value === 'string' ? value.replace(/\\n/g, '\n') : String(value ?? '');

  const applyMarkdown = (prefix: string, suffix: string) => {
    if (disabled) return;
    const el = textareaRef.current;
    if (!el) {
      onChange(normalizedValue + prefix + suffix);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selText = normalizedValue.substring(start, end);

    let replacement = '';
    if (prefix === '> ') {
      if (selText.length === 0) {
        replacement = '> ';
      } else {
        const lines = selText.split(/\r?\n/);
        replacement = lines.map((line) => `> ${line}`).join('\n');
      }
    } else {
      replacement = prefix + selText + suffix;
    }

    const newContent =
      normalizedValue.substring(0, start) +
      replacement +
      normalizedValue.substring(end);

    onChange(newContent);

    setTimeout(() => {
      el.focus();
      if (start === end) {
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      } else {
        el.setSelectionRange(start, start + replacement.length);
      }
    }, 0);
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Type size={14} className="text-brand-red shrink-0" />
          {label && (
            <label className="text-xs font-semibold text-text-secondary select-none">
              {label}
            </label>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-text-tertiary">
            Markdown
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="tablist"
            className="flex items-center p-0.5 rounded-apple-md bg-surface-canvas border border-surface-border"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'write'}
              onClick={() => setMode('write')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                mode === 'write'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Edit3 size={12} />
              <span>Write</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'preview'}
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                mode === 'preview'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-text-tertiary hidden sm:inline">
            {normalizedValue.length} chars
          </span>
        </div>
      </div>

      {mode === 'write' ? (
        <div className="flex flex-col rounded-apple-md bg-[#0E0E12] border border-surface-border hover:border-white/20 focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/20 transition-all overflow-hidden">
          <div
            role="toolbar"
            aria-label="Formatting Toolbar"
            className="flex flex-wrap items-center gap-1 p-1.5 bg-surface-canvas/80 border-b border-surface-border"
          >
            <button
              type="button"
              aria-label="Bold"
              title="Bold (**text**)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('**', '**')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Bold size={13} />
            </button>

            <button
              type="button"
              aria-label="Italic"
              title="Italic (*text*)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('*', '*')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Italic size={13} />
            </button>

            <button
              type="button"
              aria-label="Underline"
              title="Underline (__text__)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('__', '__')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <UnderlineIcon size={13} />
            </button>

            <button
              type="button"
              aria-label="Strikethrough"
              title="Strikethrough (~~text~~)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('~~', '~~')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Strikethrough size={13} />
            </button>

            <div className="h-3.5 w-px bg-white/10 mx-1" />

            <button
              type="button"
              aria-label="Code"
              title="Inline Code (`text`)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('`', '`')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Code size={13} />
            </button>

            <button
              type="button"
              aria-label="Quote"
              title="Blockquote (> text)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('> ', '')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Quote size={13} />
            </button>

            <button
              type="button"
              aria-label="Spoiler"
              title="Spoiler (||text||)"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('||', '||')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <EyeOff size={13} />
            </button>

            <button
              type="button"
              aria-label="Link"
              title="Masked Link ([text](https://))"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyMarkdown('[', '](https://)')}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <LinkIcon size={13} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={rows}
            value={normalizedValue}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm font-mono text-text-primary placeholder:text-text-tertiary outline-none resize-y leading-relaxed disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      ) : (
        <div className="rounded-apple-md bg-[#0E0E12] border border-surface-border p-4 min-h-[100px] flex flex-col justify-center">
          {normalizedValue.trim() ? (
            <DiscordMarkdown content={normalizedValue} />
          ) : (
            <span className="text-xs text-text-tertiary italic">Nothing to preview</span>
          )}
        </div>
      )}

      {helperText && <span className="text-xs text-text-tertiary">{helperText}</span>}
    </div>
  );
};
