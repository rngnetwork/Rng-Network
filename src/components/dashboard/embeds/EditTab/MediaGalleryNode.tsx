'use client';

import React from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type {
  DiscordMediaGalleryComponent,
  DiscordMediaItem,
} from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { TextInput } from '@/components/common/input/TextInput';

export interface MediaGalleryNodeProps {
  gallery: DiscordMediaGalleryComponent;
  onUpdateGallery: (
    componentId: string,
    updates: Partial<DiscordMediaGalleryComponent>
  ) => void;
  onRemove: (componentId: string) => void;
}

function normalizeMediaItem(item: string | DiscordMediaItem): DiscordMediaItem {
  if (typeof item === 'string') {
    return { url: item, description: '', spoiler: false };
  }
  return {
    url: item.url || item.media?.url || '',
    description: item.description || '',
    spoiler: Boolean(item.spoiler),
  };
}

const MediaGalleryNodeInner: React.FC<MediaGalleryNodeProps> = ({
  gallery,
  onUpdateGallery,
  onRemove,
}) => {
  const componentId = gallery.id || '';
  const normalizedItems = gallery.items.map(normalizeMediaItem);

  const handleUpdateItemUrl = (idx: number, url: string) => {
    const next = [...normalizedItems];
    next[idx] = { ...next[idx], url };
    onUpdateGallery(componentId, { items: next });
  };

  const handleAddItem = () => {
    if (normalizedItems.length >= 4) return;
    onUpdateGallery(componentId, {
      items: [
        ...normalizedItems,
        { url: 'https://cdn.discordapp.com/embed/avatars/0.png', description: '' },
      ],
    });
  };

  const handleRemoveItem = (idx: number) => {
    const next = normalizedItems.filter((_, i) => i !== idx);
    onUpdateGallery(componentId, { items: next });
  };

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-brand-red" />
          <Badge variant="neutral" size="sm">
            Media Gallery (Type 12)
          </Badge>
          <span className="text-[11px] font-mono text-zinc-400">
            {normalizedItems.length}/4 items
          </span>
        </div>

        <div className="flex items-center gap-2">
          {normalizedItems.length < 4 && (
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-apple-sm bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-zinc-200 transition-colors"
            >
              <Plus size={12} />
              <span>Add Media</span>
            </button>
          )}
          {componentId && (
            <button
              type="button"
              onClick={() => onRemove(componentId)}
              aria-label="Remove Media Gallery"
              className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {normalizedItems.map((item, idx) => (
          <div
            key={`media_${idx}`}
            className="flex items-center gap-2 p-2.5 rounded-apple-md bg-black/40 border border-white/[0.06]"
          >
            <div className="flex-1 min-w-0">
              <TextInput
                label={`Media URL #${idx + 1}`}
                value={item.url || ''}
                onChange={(e) => handleUpdateItemUrl(idx, e.target.value)}
                placeholder="https://..."
              />
            </div>
            {normalizedItems.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                aria-label={`Remove media item ${idx + 1}`}
                className="p-1.5 mt-5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MediaGalleryNode = React.memo(MediaGalleryNodeInner);
