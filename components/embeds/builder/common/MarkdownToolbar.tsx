"use client";

import React from 'react';

interface MarkdownToolbarProps {
  onApplyMarkdown: (prefix: string, suffix: string) => void;
  onOpenEmojiPicker: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showEmojiPicker?: boolean;
}

export function MarkdownToolbar({
  onApplyMarkdown,
  onOpenEmojiPicker,
  showEmojiPicker = true
}: MarkdownToolbarProps) {
  return (
    <div className="wysiwyg-md-tools">
      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Bold (**text**)"
        onClick={() => onApplyMarkdown('**', '**')}
      >
        <i className="fa-solid fa-bold" />
      </button>
      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Italic (*text*)"
        onClick={() => onApplyMarkdown('*', '*')}
      >
        <i className="fa-solid fa-italic" />
      </button>
      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Underline (__text__)"
        onClick={() => onApplyMarkdown('__', '__')}
      >
        <i className="fa-solid fa-underline" />
      </button>
      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Strikethrough (~~text~~)"
        onClick={() => onApplyMarkdown('~~', '~~')}
      >
        <i className="fa-solid fa-strikethrough" />
      </button>

      <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Inline Code (`text`)"
        onClick={() => onApplyMarkdown('`', '`')}
      >
        <i className="fa-solid fa-code" />
      </button>
      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Blockquote (> text)"
        onClick={() => onApplyMarkdown('> ', '')}
      >
        <i className="fa-solid fa-quote-left" />
      </button>
      <button
        type="button"
        className="wysiwyg-tool-btn"
        title="Spoiler (||text||)"
        onClick={() => onApplyMarkdown('||', '||')}
      >
        <i className="fa-solid fa-eye-slash" />
      </button>

      {showEmojiPicker && (
        <>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          <button
            type="button"
            className="wysiwyg-tool-btn"
            title="Pick Discord Emoji"
            onClick={onOpenEmojiPicker}
          >
            <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
          </button>
        </>
      )}
    </div>
  );
}
