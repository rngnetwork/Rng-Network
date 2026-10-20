'use client';

import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import {
  ComponentType,
  type DiscordSectionComponent,
  type DiscordThumbnailComponent,
} from '@/lib/model/embed';

export interface SectionBlockNodeProps {
  section: DiscordSectionComponent;
  onUpdateSection: (
    componentId: string,
    updates: Partial<DiscordSectionComponent>
  ) => void;
  onRemove?: (componentId: string) => void;
}

const SectionBlockNodeInner: React.FC<SectionBlockNodeProps> = ({
  section,
  onUpdateSection,
}) => {
  const componentId = section.id || '';
  const primaryText = section.components[0]?.content ?? section.text ?? '';
  const isThumbnailAccessory =
    !section.accessory ||
    (section.accessory as { type?: unknown }).type === ComponentType.THUMBNAIL ||
    (section.accessory as { type?: unknown }).type === 11 ||
    (section.accessory as { type?: unknown }).type === 'thumbnail';

  const thumbnailUrl = isThumbnailAccessory && section.accessory
    ? (section.accessory as DiscordThumbnailComponent).media_url ||
      (section.accessory as DiscordThumbnailComponent).url ||
      (section.accessory as { media?: { url?: string } }).media?.url ||
      ''
    : '';

  const handleTextChange = (value: string) => {
    onUpdateSection(componentId, {
      text: value,
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          id: section.components[0]?.id || `${componentId}_txt`,
          content: value,
        },
      ],
    });
  };

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <textarea
            value={primaryText}
            rows={3}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Section column text..."
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-[#0E0E12] border border-surface-border hover:border-white/20 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-xs sm:text-sm text-white outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2 justify-center items-center p-3 rounded-apple-md bg-black/40 border border-white/[0.06]">
          <div className="relative flex items-center justify-center p-2 rounded-apple-md bg-black/40 border border-white/[0.06] overflow-hidden aspect-square h-24 w-24 shrink-0 mx-auto">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt="Section Thumbnail"
                fill
                unoptimized
                className="object-cover rounded"
              />
            ) : (
              <ImageIcon size={24} className="text-zinc-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectionBlockNode = React.memo(SectionBlockNodeInner);
