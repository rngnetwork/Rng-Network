'use client';

import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import {
  ComponentType,
  type Type17Container,
} from '@/lib/model/embed';
import { DiscordTextDisplayPreview } from './DiscordTextDisplayPreview';
import { DiscordActionRowPreview } from './DiscordActionRowPreview';
import { DiscordSectionPreview } from './DiscordSectionPreview';
import { DiscordMediaGalleryPreview } from './DiscordMediaGalleryPreview';
import { DiscordSeparatorPreview } from './DiscordSeparatorPreview';

export interface DiscordContainerPreviewProps {
  container: Type17Container;
}

export const DiscordContainerPreview: React.FC<
  DiscordContainerPreviewProps
> = ({ container }) => {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const isBlurred = Boolean(container.isSpoiler) && !spoilerRevealed;

  return (
    <div
      style={{ borderLeftColor: container.accentColor || '#E11D2E' }}
      className="relative max-w-[520px] rounded-[8px] bg-[#2B2D31] border border-[#1E1F22] border-l-[4px] p-4 flex flex-col gap-2 overflow-hidden"
    >
      {isBlurred && (
        <button
          type="button"
          onClick={() => setSpoilerRevealed(true)}
          className="absolute inset-0 z-10 backdrop-blur-md bg-black/60 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-white"
        >
          <Eye size={15} />
          <span>Spoiler — Click to Reveal</span>
        </button>
      )}

      {(container.title?.trim() || container.description?.trim()) && (
        <div className="flex flex-col gap-1 pb-1">
          {container.title?.trim() && (
            <DiscordTextDisplayPreview
              content={`## ${container.title.trim()}`}
            />
          )}
          {container.description?.trim() && (
            <DiscordTextDisplayPreview content={container.description.trim()} />
          )}
        </div>
      )}

      {container.components.map((comp, idx) => {
        const key = comp.id || `prev_c_${idx}`;
        if (comp.type === ComponentType.TEXT_DISPLAY) {
          return <DiscordTextDisplayPreview key={key} content={comp.content} />;
        }
        if (comp.type === ComponentType.ACTION_ROW) {
          return <DiscordActionRowPreview key={key} row={comp} />;
        }
        if (comp.type === ComponentType.SECTION) {
          return <DiscordSectionPreview key={key} section={comp} />;
        }
        if (comp.type === ComponentType.MEDIA_GALLERY) {
          return <DiscordMediaGalleryPreview key={key} gallery={comp} />;
        }
        if (comp.type === ComponentType.SEPARATOR) {
          return <DiscordSeparatorPreview key={key} separator={comp} />;
        }
        return null;
      })}
    </div>
  );
};
