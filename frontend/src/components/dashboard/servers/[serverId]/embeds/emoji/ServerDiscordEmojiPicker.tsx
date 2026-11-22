'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEmojis = useCallback(async (refresh: boolean = false) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      if (refresh) setIsRefreshing(true);
      const [srvRes, botRes] = await Promise.allSettled([
        fetchServerGuildEmojis(serverId, token, refresh),
        fetchBotEmojis(token, refresh),
      ]);

      if (srvRes.status === 'fulfilled' && srvRes.value.success && Array.isArray(srvRes.value.data)) {
        setServerEmojis(srvRes.value.data);
      }
      if (botRes.status === 'fulfilled' && botRes.value.success && Array.isArray(botRes.value.data)) {
        setBotEmojis(botRes.value.data);
      }
    } catch {
      // Fallback to unicode emojis
    } finally {
      if (refresh) setIsRefreshing(false);
    }
  }, [serverId]);

  useEffect(() => {
    let isMounted = true;
    void loadEmojis(false);
    return () => {
      isMounted = false;
    };
  }, [loadEmojis]);

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
    <div className={`flex flex-col w-full h-full ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] text-[10px] text-zinc-400 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-brand-red shrink-0" />
          <span>Server ({serverEmojis.length}) &amp; Bot ({botEmojis.length}) emojis active</span>
        </div>
        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void loadEmojis(true)}
          title="Force refresh Discord bot & server emojis from Discord REST API"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-apple-sm text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-40 cursor-pointer shrink-0 ml-2"
        >
          <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-brand-red' : ''} />
          <span className="text-[9px] font-medium">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <EmojiPicker
          customCategories={customCategories}
          recentStorageKey={`rng_recent_emojis_${serverId}`}
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
