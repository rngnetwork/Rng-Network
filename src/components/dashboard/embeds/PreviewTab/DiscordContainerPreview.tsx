'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, ChevronDown } from 'lucide-react';
import {
  ComponentType,
  type Type17Container,
  type DiscordSelectComponent,
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

      {/* Author */}
      {container.author?.name?.trim() && (
        <div className="flex items-center gap-2 text-xs font-bold underline text-white mb-0.5">
          {container.author.icon_url && (
            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
              <Image
                src={container.author.icon_url}
                alt="Author Icon"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}
          <span>{container.author.name.trim()}</span>
        </div>
      )}

      {/* Title & Description with optional Thumbnail */}
      {(container.title?.trim() || container.description?.trim()) && (
        <div className="flex items-start justify-between gap-3 pb-1">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {container.title?.trim() && (
              <DiscordTextDisplayPreview
                content={`## ${container.title.trim()}`}
              />
            )}
            {container.description?.trim() && (
              <DiscordTextDisplayPreview content={container.description.trim()} />
            )}
          </div>
          {container.thumbnail && (
            <div className="relative w-14 h-14 rounded overflow-hidden shrink-0">
              <Image
                src={container.thumbnail}
                alt="Thumbnail"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Banner Image */}
      {container.image && (
        <div className="relative w-full h-40 rounded overflow-hidden my-1">
          <Image
            src={container.image}
            alt="Container Banner"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      {/* Custom Fields */}
      {container.fields && container.fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-1">
          {container.fields.map((field, fIdx) => (
            <div key={field.id || fIdx} className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">{field.name}</span>
              <span className="text-xs text-[#dbdee1]">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inner Components */}
      {container.components.map((comp, idx) => {
        const key = comp.id || `prev_c_${idx}`;
        if (comp.type === ComponentType.TEXT_DISPLAY) {
          return <DiscordTextDisplayPreview key={key} content={comp.content} />;
        }
        if (comp.type === ComponentType.ACTION_ROW) {
          return <DiscordActionRowPreview key={key} row={comp} />;
        }
        if (
          comp.type === ComponentType.STRING_SELECT ||
          comp.type === ComponentType.USER_SELECT ||
          comp.type === ComponentType.ROLE_SELECT ||
          comp.type === ComponentType.MENTIONABLE_SELECT ||
          comp.type === ComponentType.CHANNEL_SELECT
        ) {
          const sel = comp as DiscordSelectComponent;
          return (
            <div
              key={key}
              className="flex items-center justify-between p-2.5 rounded bg-[#1e1f22] border border-white/10 text-xs text-zinc-400 mt-1"
            >
              <span className="truncate">
                {sel.placeholder || 'Select an option...'}
              </span>
              <ChevronDown size={14} className="text-zinc-500 shrink-0" />
            </div>
          );
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

      {/* Footer */}
      {container.footer?.text?.trim() && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#949ba4] pt-1">
          {container.footer.icon_url && (
            <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
              <Image
                src={container.footer.icon_url}
                alt="Footer Icon"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}
          <span>{container.footer.text.trim()}</span>
        </div>
      )}
    </div>
  );
};
