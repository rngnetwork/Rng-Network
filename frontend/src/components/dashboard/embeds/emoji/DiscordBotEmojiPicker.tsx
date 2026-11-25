'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Smile, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBotEmojis = useCallback(async (refresh: boolean = false) => {
    if (initialBotEmojis) return;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;
    try {
      if (refresh) setIsRefreshing(true);
      const res = await fetchBotEmojis(token, refresh);
      if (res.success && Array.isArray(res.data)) {
        setBotEmojis(res.data);
      }
    } catch {
      // Fallback to standard unicode categories when bot emojis are unreachable
    } finally {
      if (refresh) setIsRefreshing(false);
    }
  }, [initialBotEmojis]);

  useEffect(() => {
    if (initialBotEmojis) return undefined;
    let isMounted = true;
    void Promise.resolve().then(() => {
      if (isMounted) {
        return loadBotEmojis(false);
      }
      return undefined;
    });
    return () => {
      isMounted = false;
    };
  }, [initialBotEmojis, loadBotEmojis]);

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
    <div className={`flex flex-col w-full h-full ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] text-[10px] text-zinc-400 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5">
          <Smile size={12} className="text-brand-red shrink-0" />
          <span>{botEmojis.length} custom bot emojis loaded</span>
        </div>
        {!initialBotEmojis && (
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => void loadBotEmojis(true)}
            title="Force refresh Discord bot emojis from Discord REST API"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-apple-sm text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-brand-red' : ''} />
            <span className="text-[9px] font-medium">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <EmojiPicker
          customCategories={customCategories}
          recentStorageKey="rng_recent_bot_emojis"
          placeholder="Search emojis..."
          className="w-full h-full border-none shadow-none rounded-none bg-transparent"
          onSelect={(selected) => {
            const { token, partial } = formatDiscordEmojiToken(selected);
            onSelectEmojiToken(token, partial);
          }}
        />
      </div>
    </div>
  );
};
