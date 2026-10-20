'use client';

import React, { useRef } from 'react';
import { Type, Trash2 } from 'lucide-react';
import type { DiscordTextDisplayComponent } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { MarkdownToolbar } from './MarkdownToolbar';

export interface TextDisplayNodeProps {
  node: DiscordTextDisplayComponent;
  onChangeContent: (componentId: string, content: string) => void;
  onRemove: (componentId: string) => void;
}

const TextDisplayNodeInner: React.FC<TextDisplayNodeProps> = ({
  node,
  onChangeContent,
  onRemove,
}) => {
  const componentId = node.id || '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentContent = node.content || '';

  const applyMarkdown = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selText = currentContent.substring(start, end);

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
      currentContent.substring(0, start) +
      replacement +
      currentContent.substring(end);

    onChangeContent(componentId, newContent);
    setTimeout(() => {
      el.focus();
      if (start === end) {
        el.setSelectionRange(
          start + replacement.length,
          start + replacement.length
        );
      } else {
        el.setSelectionRange(start, start + replacement.length);
      }
    }, 0);
  };

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Type size={14} className="text-brand-red" />
          <Badge variant="neutral" size="sm">
            Text Display (Type 10)
          </Badge>
          <span className="text-[11px] font-mono text-zinc-500">
            {currentContent.length} chars
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MarkdownToolbar
            onApplyMarkdown={applyMarkdown}
            showEmojiPicker={false}
          />
          {componentId && (
            <button
              type="button"
              onClick={() => onRemove(componentId)}
              aria-label="Remove Text Display"
              className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={currentContent}
        rows={3}
        onChange={(e) => onChangeContent(componentId, e.target.value)}
        placeholder="### Heading\n- List item\n**Bold text**\n> Blockquote text"
        className="w-full px-3.5 py-2.5 rounded-apple-md bg-[#0E0E12] border border-surface-border hover:border-white/20 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-xs sm:text-sm text-white font-mono outline-none transition-all resize-y leading-relaxed"
      />
    </div>
  );
};

export const TextDisplayNode = React.memo(
  TextDisplayNodeInner,
  (prev, next) =>
    prev.node.id === next.node.id && prev.node.content === next.node.content
);

