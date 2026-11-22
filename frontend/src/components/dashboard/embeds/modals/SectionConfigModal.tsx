'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import type { DiscordSectionComponent, DiscordThumbnailComponent } from '@/lib/model/embed';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';
import { DiscordMarkdownEditor } from '@/components/common/input/DiscordMarkdownEditor';
import { uploadImageFile } from '@/lib/api/upload';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (section !== prevSection) {
    setPrevSection(section);
    setCustomId(section?.id || '');
    setText(initialText);
    setThumbnailUrl(initialUrl);
    setUploadError(null);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const publicUrl = await uploadImageFile(file);
      setThumbnailUrl(publicUrl);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
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
        <TextInput
          label="Custom ID (Unique Identifier)"
          value={customId}
          placeholder="e.g. section_rules_1"
          onChange={(e) => setCustomId(e.target.value)}
        />

        <DiscordMarkdownEditor
          label="Markdown Text Content"
          value={text}
          onChange={setText}
          rows={4}
          placeholder="Enter markdown content for this section..."
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Accessory Thumbnail URL
            </label>
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-apple-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 size={12} className="animate-spin text-brand-red" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={12} className="text-cyan-400" />
                  <span>+ Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <TextInput
                value={thumbnailUrl}
                placeholder="https://images.unsplash.com/... or image URL"
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  setUploadError(null);
                }}
              />
              {uploadError && (
                <p className="mt-1 text-[11px] text-red-400 font-sans">{uploadError}</p>
              )}
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
