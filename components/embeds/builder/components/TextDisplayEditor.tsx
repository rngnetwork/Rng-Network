"use client";

import React, { useRef } from 'react';
import { DiscordTextDisplayComponent } from '../../types';
import { MarkdownToolbar } from '../common/MarkdownToolbar';

interface TextDisplayEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordTextDisplayComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordTextDisplayComponent) => void;
}

export function TextDisplayEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: TextDisplayEditorProps) {
  const currentText = comp.text || comp.content || '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyMarkdown = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selText = currentText.substring(start, end);

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

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    onUpdateComponent(cIdx, compIdx, { ...comp, text: newText, content: newText });
    setTimeout(() => {
      el.focus();
      if (start === end) {
        el.setSelectionRange(start + replacement.length, start + replacement.length);
      } else {
        el.setSelectionRange(start, start + replacement.length);
      }
    }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MarkdownToolbar
          onApplyMarkdown={applyMarkdown}
          onOpenEmojiPicker={() => {}}
          showEmojiPicker={false}
        />
        <span style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)' }}>
          Text Display (Type 10 Markdown)
        </span>
      </div>

      <textarea
        ref={textareaRef}
        className="bare-input"
        style={{
          width: '100%',
          fontSize: '12px',
          background: '#1e1f22',
          padding: '8px',
          borderRadius: '4px',
          minHeight: '60px',
          fontFamily: 'monospace'
        }}
        value={currentText}
        placeholder="### Heading\n- List item\n**Bold text**"
        onChange={(e) => onUpdateComponent(cIdx, compIdx, { ...comp, text: e.target.value, content: e.target.value })}
      />
    </div>
  );
}
