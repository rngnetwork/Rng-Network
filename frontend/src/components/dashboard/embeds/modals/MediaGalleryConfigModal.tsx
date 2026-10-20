'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import type { DiscordMediaGalleryComponent, DiscordMediaItem } from '@/lib/model/embed';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';

export interface MediaGalleryConfigModalProps {
  isOpen: boolean;
  gallery: DiscordMediaGalleryComponent | null;
  onClose: () => void;
  onSave: (updated: DiscordMediaGalleryComponent) => void;
}

export const MediaGalleryConfigModal: React.FC<MediaGalleryConfigModalProps> = ({
  isOpen,
  gallery,
  onClose,
  onSave,
}) => {
  const [prevGallery, setPrevGallery] = useState(gallery);
  const [customId, setCustomId] = useState(gallery?.id || '');
  const [items, setItems] = useState<(DiscordMediaItem | string)[]>(
    gallery?.items || []
  );

  if (gallery !== prevGallery) {
    setPrevGallery(gallery);
    setCustomId(gallery?.id || '');
    setItems(gallery?.items || []);
  }

  const getMediaUrl = (item: DiscordMediaItem | string): string => {
    if (typeof item === 'string') return item;
    return item?.media?.url || item?.url || '';
  };

  const handleUpdateUrl = (idx: number, url: string) => {
    const updated = [...items];
    updated[idx] = { media: { url }, url };
    setItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    if (items.length >= 4) return;
    setItems([
      ...items,
      {
        media: { url: 'https://cdn.discordapp.com/embed/avatars/0.png' },
        url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      },
    ]);
  };

  const handleSave = () => {
    if (!gallery) return;
    const trimmedId = customId.trim() || gallery.id || `gallery_${Date.now()}`;
    const updated: DiscordMediaGalleryComponent = {
      ...gallery,
      type: 12,
      id: trimmedId,
      items,
    };
    onSave(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Media Gallery Settings"
      description="Configure settings of Media Gallery in the embedded message"
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
          placeholder="e.g. gallery_screenshots"
          onChange={(e) => setCustomId(e.target.value)}
        />

        {/* Gallery Images List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Gallery Images ({items.length}/4)
            </label>
            {items.length < 4 && (
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-apple-sm bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Media</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {items.map((item, idx) => {
              const url = getMediaUrl(item);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-apple-md bg-surface-canvas border border-white/10 shadow-apple-card"
                >
                  {/* Thumbnail preview */}
                  <div className="relative w-12 h-12 rounded bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {url ? (
                      <Image
                        src={url}
                        alt={`Gallery item ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon size={16} className="text-zinc-600" />
                    )}
                  </div>

                  {/* URL Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={url}
                      placeholder="https://example.com/image.png"
                      onChange={(e) => handleUpdateUrl(idx, e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-black/40 border border-white/10 focus:border-brand-red text-xs text-white outline-none font-sans"
                    />
                  </div>

                  {/* Delete button */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remove image"
                      className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="py-6 text-center text-xs text-zinc-500 rounded-apple-md border border-dashed border-white/10">
                No images in gallery yet. Click &quot;Add Media&quot; above to add images.
              </div>
            )}
          </div>
        </div>

        {/* Live Gallery Preview Grid */}
        {items.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Live Gallery Preview
            </label>
            <div
              className={`grid gap-2 p-3 rounded-apple-lg bg-[#1E1F22] border border-white/10 overflow-hidden ${
                items.length === 1
                  ? 'grid-cols-1'
                  : items.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2'
              }`}
            >
              {items.map((item, idx) => {
                const url = getMediaUrl(item);
                return (
                  <div
                    key={idx}
                    className={`relative rounded bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center ${
                      items.length === 1
                        ? 'h-48 w-full'
                        : items.length === 3 && idx === 0
                        ? 'row-span-2 h-full min-h-[140px]'
                        : 'h-24 w-full'
                    }`}
                  >
                    {url ? (
                      <Image
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon size={18} className="text-zinc-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
