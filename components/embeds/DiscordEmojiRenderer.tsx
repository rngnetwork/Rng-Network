/* eslint-disable @next/next/no-img-element */
import React from 'react';

export interface DiscordEmojiInfo {
  id?: string;
  name?: string;
  animated?: boolean;
}

export interface ParsedDiscordEmoji {
  id?: string;
  name?: string;
  animated?: boolean;
  isCustom: boolean;
  url?: string;
}

/**
 * Parses a string, object, or PartialEmojiObject into Discord emoji metadata.
 * Detects Discord custom emoji formats: <:name:id> and <a:name:id>.
 */
export function parseDiscordCustomEmoji(
  emoji?: string | DiscordEmojiInfo | null
): ParsedDiscordEmoji | null {
  if (!emoji) return null;

  if (typeof emoji === 'object') {
    if (emoji.id && String(emoji.id).trim().length > 0) {
      const isAnim = Boolean(emoji.animated);
      const ext = isAnim ? 'gif' : 'webp';
      const cleanId = String(emoji.id).trim();
      return {
        id: cleanId,
        name: emoji.name || 'custom_emoji',
        animated: isAnim,
        isCustom: true,
        url: `https://cdn.discordapp.com/emojis/${cleanId}.${ext}?size=48&quality=lossless`
      };
    }
    return {
      name: emoji.name || '',
      isCustom: false
    };
  }

  const str = String(emoji).trim();
  const match = str.match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/);
  if (match) {
    const isAnim = match[1] === 'a';
    const name = match[2];
    const id = match[3];
    const ext = isAnim ? 'gif' : 'webp';
    return {
      id,
      name,
      animated: isAnim,
      isCustom: true,
      url: `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`
    };
  }

  return {
    name: str,
    isCustom: false
  };
}

/**
 * Renders a Discord emoji as an authentic high-resolution image (for custom bot/server emojis)
 * or as a styled span (for unicode emojis), preventing raw Discord emoji IDs from displaying.
 */
export function renderDiscordEmoji(
  emoji?: string | DiscordEmojiInfo | null,
  size: number = 18
): React.ReactNode {
  if (!emoji) return null;

  const parsed = parseDiscordCustomEmoji(emoji);
  if (!parsed) return null;

  if (parsed.isCustom && parsed.url && parsed.id) {
    return (
      <img
        src={parsed.url}
        alt={`:${parsed.name}:`}
        title={`:${parsed.name}:`}
        className="discord-custom-rendered-emoji"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          verticalAlign: 'middle',
          display: 'inline-block',
          flexShrink: 0
        }}
        onError={(e) => {
          const target = e.currentTarget;
          if (parsed.id && !target.src.includes('.png')) {
            target.src = `https://cdn.discordapp.com/emojis/${parsed.id}.png?size=48`;
          } else {
            target.style.display = 'none';
          }
        }}
      />
    );
  }

  if (parsed.name) {
    return (
      <span
        style={{
          fontSize: `${size}px`,
          lineHeight: 1,
          verticalAlign: 'middle',
          display: 'inline-block'
        }}
      >
        {parsed.name}
      </span>
    );
  }

  return null;
}
