'use client';

import React from 'react';
import Image from 'next/image';
import type {
  DiscordMediaGalleryComponent,
  DiscordMediaItem,
} from '@/lib/model/embed';

export interface DiscordMediaGalleryPreviewProps {
  gallery: DiscordMediaGalleryComponent;
}

function getItemUrl(item: string | DiscordMediaItem): string {
  if (typeof item === 'string') return item;
  return item.url || item.media?.url || '';
}

export const DiscordMediaGalleryPreview: React.FC<
  DiscordMediaGalleryPreviewProps
> = ({ gallery }) => {
  const urls = gallery.items.map(getItemUrl).filter(Boolean).slice(0, 4);

  if (urls.length === 0) return null;

  return (
    <div
      className={`grid gap-1.5 my-2 rounded-[8px] overflow-hidden ${
        urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
      }`}
    >
      {urls.map((url, idx) => (
        <div
          key={`${url}_${idx}`}
          className="relative w-full h-44 bg-[#1E1F22] rounded-[4px] overflow-hidden"
        >
          <Image
            src={url}
            alt={`Media item ${idx + 1}`}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
};
