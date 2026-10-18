'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import type { DiscordSectionComponent, DiscordThumbnailComponent } from '@/lib/model/embed';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';
import { MarkdownToolbar } from '../EditTab/MarkdownToolbar';

export interface SectionConfigModalProps {
  isOpen: boolean;
  section: DiscordSectionComponent | null;
  onOpenEmojiPicker?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onSave: (updated: DiscordSectionComponent) => void;
}

export const SectionConfigModal: React.FC<SectionConfigModalProps> = ({
  isOpen,
  section,
  onOpenEmojiPicker,
  onClose,
  onSave,
}) => {
  const [prevSection, setPrevSection] = useState(section);

  const initialAcc = section?.accessory;
  const initialUrl =
    initialAcc && 'media' in initialAcc && initialAcc.media?.url
      ? initialAcc.media.url
      : initialAcc && 'media_url' in initialAcc && typeof initialAcc.media_url === 'string'
      ? initialAcc.media_url
      : initialAcc && 'url' in initialAcc && typeof initialAcc.url === 'string'
      ? initialAcc.url
      : '';

  const initialText =
    section?.text ||
    (section?.components && section.components[0]?.content) ||
    '';

  const [customId, setCustomId] = useState(section?.id || '');
  const [text, setText] = useState(initialText);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialUrl);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const historyRef = useRef<string[]>([initialText]);
  const historyIndexRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (section !== prevSection) {
    setPrevSection(section);
    setCustomId(section?.id || '');
    setText(initialText);
    setThumbnailUrl(initialUrl);
    historyRef.current = [initialText];
    historyIndexRef.current = 0;
  }

  const pushHistory = (newVal: string) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(newVal);
    if (nextHistory.length > 50) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  const updateTextWithHistory = (newVal: string) => {
    if (newVal === text) return;
    pushHistory(newVal);
    setText(newVal);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      pushHistory(newVal);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    if (cmdKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
        const target = historyRef.current[historyIndexRef.current];
        setText(target);
      }
    } else if (cmdKey && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      e.stopPropagation();
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current += 1;
        const target = historyRef.current[historyIndexRef.current];
        setText(target);
      }
    }
  };

  const handleApplyMarkdown = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) {
      updateTextWithHistory(`${text}${prefix}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);

    let replacement = '';
    if (prefix === '> ') {
      if (selected.length === 0) {
        replacement = '> ';
      } else {
        const lines = selected.split(/\r?\n/);
        replacement = lines
          .map((line) => (line.startsWith('> ') ? line : `> ${line}`))
          .join('\n');
      }
    } else {
      replacement = prefix + selected + suffix;
    }

    const newText = text.slice(0, start) + replacement + text.slice(end);
    updateTextWithHistory(newText);
    setTimeout(() => {
      el.focus();
      if (start === end) {
        el.setSelectionRange(start + replacement.length, start + replacement.length);
      } else {
        el.setSelectionRange(start, start + replacement.length);
      }
    }, 0);
  };

  const handleSave = () => {
    if (!section) return;
    const trimmedId = customId.trim() || section.id || `sec_${Date.now()}`;
    const trimmedText = text.trim();
    const trimmedThumb = thumbnailUrl.trim();

    const accessory: DiscordThumbnailComponent | undefined = trimmedThumb
      ? {
          type: 11,
          media: { url: trimmedThumb },
          media_url: trimmedThumb,
        }
      : undefined;

    const updated: DiscordSectionComponent = {
      ...section,
      type: 9,
      id: trimmedId,
      text: trimmedText,
      components: [{ type: 10, content: trimmedText }],
      accessory,
    };

    onSave(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Section Settings"
      description="Configure settings of Section in the embedded message."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Custom ID */}
        <TextInput
          label="Custom ID (Unique Identifier)"
          value={customId}
          placeholder="e.g. section_rules_1"
          onChange={(e) => setCustomId(e.target.value)}
        />

        {/* Markdown Text Area with MarkdownToolbar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Markdown Text Content
            </label>
            <MarkdownToolbar
              onApplyMarkdown={handleApplyMarkdown}
              onOpenEmojiPicker={onOpenEmojiPicker}
              showEmojiPicker={Boolean(onOpenEmojiPicker)}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            rows={4}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter markdown content for this section..."
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-[#0E0E12] border border-surface-border hover:border-white/20 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-xs sm:text-sm text-white font-sans outline-none transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Accessory Thumbnail URL & Preview */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300">
            Accessory Thumbnail URL
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <TextInput
                value={thumbnailUrl}
                placeholder="https://images.unsplash.com/... or image URL"
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>

            <div className="relative w-16 h-16 rounded-apple-md bg-surface-canvas border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-apple-card">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt="Thumbnail Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <ImageIcon size={20} className="text-zinc-600" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

