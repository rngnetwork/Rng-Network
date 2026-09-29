"use client";

import React, { useRef } from 'react';
import { MarkdownToolbar } from './MarkdownToolbar';
import { EmojiItem } from '../../emoji-data';

interface NormalMessageBoxProps {
  messageContent: string;
  setMessageContent: React.Dispatch<React.SetStateAction<string>>;
  onOpenEmojiPicker: (
    e: React.MouseEvent<HTMLButtonElement>,
    onSelect: (emoji: EmojiItem, insertStr: string) => void
  ) => void;
}

export function NormalMessageBox({
  messageContent,
  setMessageContent,
  onOpenEmojiPicker
}: NormalMessageBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyMarkdown = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selText = messageContent.substring(start, end);
    const newText = messageContent.substring(0, start) + prefix + selText + suffix + messageContent.substring(end);
    setMessageContent(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleEmojiClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenEmojiPicker(e, (_emoji, insertStr) => {
      const el = textareaRef.current;
      if (!el) {
        setMessageContent((prev) => prev + insertStr);
        return;
      }
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const newText = messageContent.substring(0, start) + insertStr + messageContent.substring(end);
      setMessageContent(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + insertStr.length, start + insertStr.length);
      }, 0);
    });
  };

  return (
    <div className="wysiwyg-normal-msg-box">
      <div className="msg-top-bar">
        <MarkdownToolbar
          onApplyMarkdown={applyMarkdown}
          onOpenEmojiPicker={handleEmojiClick}
          showEmojiPicker={true}
        />
        <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
          Normal Message Box (Markdown Supported)
        </span>
      </div>

      <textarea
        ref={textareaRef}
        className="wysiwyg-msg-input"
        placeholder="Type normal message content (e.g. sage. / announcements)..."
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        rows={2}
      />
    </div>
  );
}
