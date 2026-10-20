'use client';

import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import type {
  DiscordMediaGalleryComponent,
  DiscordMediaItem,
} from '@/lib/model/embed';

export interface MediaGalleryNodeProps {
  gallery: DiscordMediaGalleryComponent;
  onUpdateGallery: (
    componentId: string,
    updates: Partial<DiscordMediaGalleryComponent>
  ) => void;
  onRemove?: (componentId: string) => void;
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
}) => {
  const normalizedItems = (gallery.items || []).map(normalizeMediaItem);

  if (normalizedItems.length === 0) {
    return (
      <div className="p-4 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] text-center text-xs text-zinc-500">
        Empty Media Gallery. Click settings gear to add images.
      </div>
    );
  }

  return (
    <div className="p-3 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08]">
      <div
        className={`grid gap-2 overflow-hidden rounded-apple-md ${
          normalizedItems.length === 1
            ? 'grid-cols-1'
            : normalizedItems.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-2'
        }`}
      >
        {normalizedItems.map((item, idx) => {
          const url = item.url;
          return (
            <div
              key={idx}
              className={`relative bg-black/40 border border-white/[0.08] rounded-apple-md overflow-hidden flex items-center justify-center ${
                normalizedItems.length === 1
                  ? 'h-64 sm:h-72 w-full'
                  : normalizedItems.length === 3 && idx === 0
                  ? 'row-span-2 h-full min-h-[160px]'
                  : 'h-36 sm:h-40 w-full'
              }`}
            >
              {url ? (
                <Image
                  src={url}
                  alt={`Media item ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <ImageIcon size={24} className="text-zinc-600" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MediaGalleryNode = React.memo(MediaGalleryNodeInner);
