'use client';

import React from 'react';
import Image from 'next/image';
import type { PartialEmojiObject } from '@/lib/model/common';

export interface DiscordEmojiProps {
  emoji?: string | PartialEmojiObject | { id?: string; name?: string; animated?: boolean };
  className?: string;
}

export const DiscordEmoji: React.FC<DiscordEmojiProps> = ({
  emoji,
  className = 'w-4 h-4 object-contain inline-block align-middle shrink-0',
}) => {
  if (!emoji) return null;

  // Object with ID (Custom Bot / Guild Emoji)
  if (typeof emoji === 'object' && emoji.id) {
    const ext = emoji.animated ? 'gif' : 'webp';
    return (
      <Image
        src={`https://cdn.discordapp.com/emojis/${emoji.id}.${ext}?size=48&quality=lossless`}
        alt={emoji.name ? `:${emoji.name}:` : 'emoji'}
        title={emoji.name ? `:${emoji.name}:` : undefined}
        width={18}
        height={18}
        unoptimized
        className={className}
      />
    );
  }

  // String token <:name:id> or <a:name:id>
  if (typeof emoji === 'string') {
    const match = emoji.match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/);
    if (match) {
      const animated = Boolean(match[1]);
      const name = match[2];
      const id = match[3];
      const ext = animated ? 'gif' : 'webp';
      return (
        <Image
          src={`https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`}
          alt={`:${name}:`}
          title={`:${name}:`}
          width={18}
          height={18}
          unoptimized
          className={className}
        />
      );
    }
    // Unicode emoji string
    return <span>{emoji}</span>;
  }

  // Fallback: object without ID (name could be <:name:id> or unicode emoji)
  if (typeof emoji === 'object' && emoji.name) {
    const match = emoji.name.match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/);
    if (match) {
      const animated = Boolean(match[1]);
      const name = match[2];
      const id = match[3];
      const ext = animated ? 'gif' : 'webp';
      return (
        <Image
          src={`https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`}
          alt={`:${name}:`}
          title={`:${name}:`}
          width={18}
          height={18}
          unoptimized
          className={className}
        />
      );
    }
    return <span>{emoji.name}</span>;
  }

  return null;
};
