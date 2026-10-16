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
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  if (gallery !== prevGallery) {
    setPrevGallery(gallery);
    setCustomId(gallery?.id || '');
    setItems(gallery?.items || []);
    setNewUrl('');
    setUrlError('');
  }

  const getMediaUrl = (item: DiscordMediaItem | string): string => {
    if (typeof item === 'string') return item;
    return item?.media?.url || item?.url || '';
  };

  const handleUpdateUrl = (idx: number, url: string) => {
    const updated = [...items];
    updated[idx] = { media: { url } };
    setItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) {
      setUrlError('Please enter a valid image URL');
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setUrlError('Image URL must start with http:// or https://');
      return;
    }
    if (items.length >= 4) {
      setUrlError('A Discord Media Gallery can hold a maximum of 4 images');
      return;
    }

    setItems([...items, { media: { url: trimmed } }]);
    setNewUrl('');
    setUrlError('');
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
      title="Media Gallery Settings (Type 12 • Max 4 Items)"
      description="Configure up to 4 image attachments rendered in Discord's native media gallery grid."
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
            <span className="text-[11px] text-zinc-400">
              Max 4 images per Discord gallery
            </span>
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
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    title="Remove image"
                    className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="py-6 text-center text-xs text-zinc-500 rounded-apple-md border border-dashed border-white/10">
                No images in gallery yet. Add up to 4 images below.
              </div>
            )}
          </div>
        </div>

        {/* Add New Image Input (if < 4) */}
        {items.length < 4 && (
          <div className="p-3.5 rounded-apple-lg bg-surface-canvas border border-dashed border-white/15 flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              Add New Image
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newUrl}
                placeholder="Paste image URL (PNG, JPG, WebP, GIF)..."
                onChange={(e) => {
                  setNewUrl(e.target.value);
                  if (urlError) setUrlError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-apple-md bg-black/40 border border-white/10 focus:border-brand-red text-xs text-white outline-none"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus size={13} className="mr-1" /> Add
              </Button>
            </div>
            {urlError && (
              <span className="text-[11px] text-red-400">{urlError}</span>
            )}
          </div>
        )}

        {/* Live Gallery Preview Grid */}
        {items.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Live Gallery Preview
            </label>
            <div
              className={`grid gap-2 p-3 rounded-apple-lg bg-[#1E1F22] border border-white/10 max-h-48 overflow-hidden ${
                items.length === 1
                  ? 'grid-cols-1'
                  : items.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {items.map((item, idx) => {
                const url = getMediaUrl(item);
                return (
                  <div
                    key={idx}
                    className="relative h-24 rounded bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center"
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

