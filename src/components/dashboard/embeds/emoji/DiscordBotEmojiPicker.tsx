'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Smile } from 'lucide-react';
import {
  EmojiPicker,
  type CustomEmoji,
  type EmojiCategory,
} from '@/components/common/input/EmojiPicker';
import { fetchBotEmojis } from '@/lib/api/dashboard/embeds';
import type { DiscordEmojiData, PartialEmojiObject } from '@/lib/model/common';

export interface DiscordBotEmojiPickerProps {
  onSelectEmojiToken: (
    token: string,
    partialEmoji: PartialEmojiObject
  ) => void;
  initialBotEmojis?: DiscordEmojiData[];
  className?: string;
}

export function formatDiscordEmojiToken(emoji: string | CustomEmoji): {
  token: string;
  partial: PartialEmojiObject;
} {
  if (typeof emoji === 'string') {
    return {
      token: emoji,
      partial: { name: emoji },
    };
  }
  const prefix = emoji.animated ? '<a:' : '<:';
  return {
    token: `${prefix}${emoji.name}:${emoji.id}>`,
    partial: {
      id: emoji.id,
      name: emoji.name,
      animated: Boolean(emoji.animated),
    },
  };
}

export const DiscordBotEmojiPicker: React.FC<DiscordBotEmojiPickerProps> = ({
  onSelectEmojiToken,
  initialBotEmojis,
  className = '',
}) => {
  const [botEmojis, setBotEmojis] = useState<DiscordEmojiData[]>(
    initialBotEmojis ?? []
  );

  useEffect(() => {
    if (initialBotEmojis) return undefined;
    let isMounted = true;

    const loadBotEmojis = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('rng_access_token') ||
            localStorage.getItem('accessToken') ||
            undefined
          : undefined;
      try {
        const res = await fetchBotEmojis(token);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setBotEmojis(res.data);
        }
      } catch {
        // Fallback to standard unicode categories when bot emojis are unreachable
      }
    };

    void loadBotEmojis();
    return () => {
      isMounted = false;
    };
  }, [initialBotEmojis]);

  const customCategories: EmojiCategory[] = useMemo(() => {
    if (botEmojis.length === 0) return [];
    const mapped: CustomEmoji[] = botEmojis.map((item) => ({
      id: item.id,
      name: item.name,
      animated: Boolean(item.animated),
      url:
        item.url ||
        `https://cdn.discordapp.com/emojis/${item.id}.${
          item.animated ? 'gif' : 'webp'
        }?size=64&quality=lossless`,
    }));
    return [
      {
        id: 'bot_emojis',
        name: `Bot Emojis (${mapped.length})`,
        emojis: mapped,
      },
    ];
  }, [botEmojis]);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {botEmojis.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] text-[10px] text-zinc-400 border-b border-white/[0.04]">
          <Smile size={12} className="text-brand-red shrink-0" />
          <span>{botEmojis.length} custom bot emojis loaded</span>
        </div>
      )}
      <EmojiPicker
        customCategories={customCategories}
        recentStorageKey="rng_recent_bot_emojis"
        placeholder="Search emojis..."
        className="w-full border-none shadow-none rounded-none bg-transparent"
        onSelect={(selected) => {
          const { token, partial } = formatDiscordEmojiToken(selected);
          onSelectEmojiToken(token, partial);
        }}
      />
    </div>
  );
};
