'use client';

import React from 'react';
import Image from 'next/image';
import {
  ComponentType,
  type DiscordSectionComponent,
  type DiscordThumbnailComponent,
  type DiscordButtonComponent,
} from '@/lib/model/embed';
import { DiscordTextDisplayPreview } from './DiscordTextDisplayPreview';

export interface DiscordSectionPreviewProps {
  section: DiscordSectionComponent;
}

export const DiscordSectionPreview: React.FC<DiscordSectionPreviewProps> = ({
  section,
}) => {
  const isThumbnail =
    section.accessory &&
    (section.accessory.type === ComponentType.THUMBNAIL ||
      section.accessory.type === 'thumbnail');

  const thumbnailUrl = isThumbnail
    ? (section.accessory as DiscordThumbnailComponent).media_url ||
      (section.accessory as DiscordThumbnailComponent).url ||
      ''
    : '';

  const buttonAccessory =
    !isThumbnail && section.accessory
      ? (section.accessory as DiscordButtonComponent)
      : null;

  return (
    <div className="flex items-start justify-between gap-4 my-1.5">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {section.components.map((txt, idx) => (
          <DiscordTextDisplayPreview
            key={txt.id || `sec_txt_${idx}`}
            content={txt.content}
          />
        ))}
      </div>

      {isThumbnail && thumbnailUrl ? (
        <div className="relative w-20 h-20 rounded-[8px] overflow-hidden bg-[#1E1F22] shrink-0">
          <Image
            src={thumbnailUrl}
            alt="Section Thumbnail"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      {buttonAccessory ? (
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-[3px] bg-[#4E5058] hover:bg-[#6D6F78] text-white text-[14px] font-medium shrink-0 transition-colors"
        >
          {buttonAccessory.label || 'Action'}
        </button>
      ) : null}
    </div>
  );
};
