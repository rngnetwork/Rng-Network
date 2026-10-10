'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Smile, Sparkles } from 'lucide-react';
import {
  EmojiPicker,
  type CustomEmoji,
  type EmojiCategory,
} from '@/components/common/input/EmojiPicker';
import { fetchBotEmojis } from '@/lib/api/dashboard/embeds';
import { fetchServerGuildEmojis } from '@/lib/api/dashboard/servers/[serverId]/embeds';
import type { DiscordEmojiData, PartialEmojiObject } from '@/lib/model/common';
import { formatDiscordEmojiToken } from '@/components/dashboard/embeds/emoji/DiscordBotEmojiPicker';

export interface ServerDiscordEmojiPickerProps {
  serverId: string;
  onSelectEmojiToken: (
    token: string,
    partialEmoji: PartialEmojiObject
  ) => void;
  className?: string;
}

export const ServerDiscordEmojiPicker: React.FC<
  ServerDiscordEmojiPickerProps
> = ({ serverId, onSelectEmojiToken, className = '' }) => {
  const [serverEmojis, setServerEmojis] = useState<DiscordEmojiData[]>([]);
  const [botEmojis, setBotEmojis] = useState<DiscordEmojiData[]>([]);

  useEffect(() => {
    let isMounted = true;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    const loadEmojis = async () => {
      try {
        const [srvRes, botRes] = await Promise.allSettled([
          fetchServerGuildEmojis(serverId, token),
          fetchBotEmojis(token),
        ]);

        if (isMounted) {
          if (srvRes.status === 'fulfilled' && srvRes.value.success && Array.isArray(srvRes.value.data)) {
            setServerEmojis(srvRes.value.data);
          }
          if (botRes.status === 'fulfilled' && botRes.value.success && Array.isArray(botRes.value.data)) {
            setBotEmojis(botRes.value.data);
          }
        }
      } catch {
        // Fallback to unicode emojis
      }
    };

    void loadEmojis();
    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const customCategories: EmojiCategory[] = useMemo(() => {
    const cats: EmojiCategory[] = [];

    if (serverEmojis.length > 0) {
      const srvMapped: CustomEmoji[] = serverEmojis.map((e) => ({
        id: e.id,
        name: e.name,
        animated: Boolean(e.animated),
        url:
          e.url ||
          `https://cdn.discordapp.com/emojis/${e.id}.${
            e.animated ? 'gif' : 'webp'
          }?size=64&quality=lossless`,
      }));
      cats.push({
        id: 'server_custom_emojis',
        name: `Server Emojis (${srvMapped.length})`,
        emojis: srvMapped,
      });
    }

    if (botEmojis.length > 0) {
      const botMapped: CustomEmoji[] = botEmojis.map((e) => ({
        id: e.id,
        name: e.name,
        animated: Boolean(e.animated),
        url:
          e.url ||
          `https://cdn.discordapp.com/emojis/${e.id}.${
            e.animated ? 'gif' : 'webp'
          }?size=64&quality=lossless`,
      }));
      cats.push({
        id: 'global_bot_emojis',
        name: `Bot Emojis (${botMapped.length})`,
        emojis: botMapped,
      });
    }

    return cats;
  }, [serverEmojis, botEmojis]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-3 py-1.5 rounded-apple-md bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-brand-red shrink-0" />
          <span>
            Guild #{serverId} custom emojis ({serverEmojis.length}) + Bot emojis ({botEmojis.length})
          </span>
        </div>
        <Smile size={13} className="text-zinc-500 shrink-0" />
      </div>

      <EmojiPicker
        customCategories={customCategories}
        recentStorageKey={`rng_recent_emojis_${serverId}`}
        placeholder="Search server, bot, or Unicode emojis..."
        onSelect={(selected) => {
          const { token, partial } = formatDiscordEmojiToken(selected);
          onSelectEmojiToken(token, partial);
        }}
      />
    </div>
  );
};
