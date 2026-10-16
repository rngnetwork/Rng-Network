'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Columns, Sparkles, Smile, Image as ImageIcon } from 'lucide-react';
import type { DiscordSectionComponent, DiscordThumbnailComponent } from '@/lib/model/embed';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';

export interface SectionConfigModalProps {
  isOpen: boolean;
  section: DiscordSectionComponent | null;
  onClose: () => void;
  onSave: (updated: DiscordSectionComponent) => void;
}

export const SectionConfigModal: React.FC<SectionConfigModalProps> = ({
  isOpen,
  section,
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

  if (section !== prevSection) {
    setPrevSection(section);
    setCustomId(section?.id || '');
    setText(initialText);
    setThumbnailUrl(initialUrl);
  }

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

  const QUICK_EMOJIS = ['🚀', '⚡', '🔥', '🛡️', '✨', '📌', '⚠️', '✅'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Section Settings (Type 9 • Section)"
      description="Configure section column markdown text paired with a right-aligned thumbnail accessory."
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

        {/* Markdown Text Area with Quick Emoji Pills */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Markdown Text Content
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-zinc-400 mr-1 flex items-center gap-1">
                <Smile size={12} className="text-amber-400" /> Quick:
              </span>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setText((prev) => `${prev} ${emoji}`)}
                  className="px-1.5 py-0.5 rounded text-xs bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 transition-colors"
                  title={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={text}
            rows={4}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter markdown content for this section..."
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/50 border border-white/10 focus:border-brand-red text-xs sm:text-sm text-white font-sans outline-none transition-colors resize-y leading-relaxed"
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
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Thumbnail image is displayed aligned to the right side of the section text.
              </span>
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

