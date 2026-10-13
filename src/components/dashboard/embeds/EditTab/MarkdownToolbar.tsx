'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  EyeOff,
  Link as LinkIcon,
  Smile,
} from 'lucide-react';

export interface MarkdownToolbarProps {
  onApplyMarkdown: (prefix: string, suffix: string) => void;
  onOpenEmojiPicker?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showEmojiPicker?: boolean;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onApplyMarkdown,
  onOpenEmojiPicker,
  showEmojiPicker = true,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Discord Markdown Formatting"
      className="flex flex-wrap items-center gap-1 p-1 rounded-apple-md bg-black/40 border border-white/10"
    >
      <button
        type="button"
        title="Bold (**text**)"
        onClick={() => onApplyMarkdown('**', '**')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Bold size={13} />
      </button>

      <button
        type="button"
        title="Italic (*text*)"
        onClick={() => onApplyMarkdown('*', '*')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Italic size={13} />
      </button>

      <button
        type="button"
        title="Underline (__text__)"
        onClick={() => onApplyMarkdown('__', '__')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <UnderlineIcon size={13} />
      </button>

      <button
        type="button"
        title="Strikethrough (~~text~~)"
        onClick={() => onApplyMarkdown('~~', '~~')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Strikethrough size={13} />
      </button>

      <div className="h-3.5 w-px bg-white/15 mx-1" />

      <button
        type="button"
        title="Inline Code (`text`)"
        onClick={() => onApplyMarkdown('`', '`')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Code size={13} />
      </button>

      <button
        type="button"
        title="Blockquote (> text)"
        onClick={() => onApplyMarkdown('> ', '')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Quote size={13} />
      </button>

      <button
        type="button"
        title="Spoiler (||text||)"
        onClick={() => onApplyMarkdown('||', '||')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <EyeOff size={13} />
      </button>

      <button
        type="button"
        title="Masked Link ([text](url))"
        onClick={() => onApplyMarkdown('[', '](https://)')}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <LinkIcon size={13} />
      </button>

      {showEmojiPicker && onOpenEmojiPicker && (
        <>
          <div className="h-3.5 w-px bg-white/15 mx-1" />
          <button
            type="button"
            title="Emoji Picker"
            onClick={onOpenEmojiPicker}
            className="p-1.5 rounded text-amber-400 hover:text-amber-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Smile size={13} />
          </button>
        </>
      )}
    </div>
  );
};
