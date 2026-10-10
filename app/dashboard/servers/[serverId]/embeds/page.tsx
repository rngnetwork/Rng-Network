"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import '@/components/embeds/embed-builder.css';
import { Type17Container, EmbedAction } from '@/components/embeds/types';
import { MessageBuilder } from '@/components/embeds/MessageBuilder';
import { TemplatesTab } from '@/components/embeds/TemplatesTab';
import { ActionTemplatesTab } from '@/components/embeds/ActionTemplatesTab';
import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';
import { api, ServerDetail, ChannelItem } from '@/lib/api';
import { EmojiItem } from '@/components/embeds/emoji-data';
import { buildDiscordV2MessagePayload } from '@/components/embeds/validation';
import { motion } from 'framer-motion';
import { Boxes, Layers, Zap } from 'lucide-react';

export default function ServerEmbedsPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerDetail | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [serverEmojis, setServerEmojis] = useState<EmojiItem[]>([]);
  const [botEmojis] = useState<EmojiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Top level active tab: 'builder' | 'templates' | 'actions'
  const [activeTopTab, setActiveTopTab] = useState<'builder' | 'templates' | 'actions'>('builder');
  const [availableActions, setAvailableActions] = useState<EmbedAction[]>([]);

  const loadActions = useCallback(async () => {
    if (!serverId) return;
    try {
      const res = await api.fetchServerActions(serverId);
      if (res.success && res.data) {
        const filtered = res.data.filter(
          (a) => a.isGlobal || a.serverId === serverId || (a.serverIds && a.serverIds.includes(serverId))
        );
        setAvailableActions(filtered);
      }
    } catch (err) {
      console.warn('Failed to load server actions:', err);
    }
  }, [serverId]);

  useEffect(() => {
    if (!serverId) return;
    let isMounted = true;
    api.fetchServerActions(serverId).then((res) => {
      if (isMounted && res.success && res.data) {
        const filtered = res.data.filter(
          (a) => a.isGlobal || a.serverId === serverId || (a.serverIds && a.serverIds.includes(serverId))
        );
        setAvailableActions(filtered);
      }
    }).catch((err) => {
      console.warn('Failed to load server actions:', err);
    });
    return () => {
      isMounted = false;
    };
  }, [serverId]);

  // Active message content & Type 17 Containers
  const [messageContent, setMessageContent] = useState<string>("");
  const [containers, setContainers] = useState<Type17Container[]>([]);

  // Unsaved changes tracking
  const [savedState, setSavedState] = useState<{ messageContent: string; containers: Type17Container[] }>({
    messageContent: "",
    containers: []
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch server details, server channels, real server emojis and bot emojis
  useEffect(() => {
    let isMounted = true;

    const loadServerData = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [serverRes, channelsRes, emojisRes] = await Promise.allSettled([
          api.fetchServerDetails(token, serverId),
          api.fetchDispatchChannels(serverId, token),
          api.fetchServerEmojis(serverId, token)
        ]);

        if (isMounted) {
          if (serverRes.status === 'fulfilled' && serverRes.value.success && serverRes.value.data) {
            setServer(serverRes.value.data);
          }

          if (channelsRes.status === 'fulfilled' && channelsRes.value.success && channelsRes.value.data && channelsRes.value.data.length > 0) {
            setChannels(channelsRes.value.data);
          } else {
            // Fallback to fetchServerChannels
            try {
              const fallbackChannels = await api.fetchServerChannels(token, serverId);
              if (fallbackChannels.success && fallbackChannels.data) {
                setChannels(fallbackChannels.data);
              }
            } catch (err) {
              console.warn('Fallback channel fetch failed:', err);
            }
          }

          if (emojisRes.status === 'fulfilled' && emojisRes.value.success && emojisRes.value.data && emojisRes.value.data.length > 0) {
            const mappedEmojis: EmojiItem[] = emojisRes.value.data.map((e) => ({
              type: 'custom',
              id: e.id,
              name: e.name,
              animated: e.animated,
              url: e.url,
              category: 'server',
              keywords: [e.name, 'server']
            }));
            setServerEmojis(mappedEmojis);
          }
        }
      } catch (err) {
        console.error('Failed to load server embed context:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServerData();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  // Handle container and message edits
  const handleSetMessageContent: React.Dispatch<React.SetStateAction<string>> = (val) => {
    setMessageContent((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (next !== prev) setIsDirty(true);
      return next;
    });
  };

  const handleSetContainers: React.Dispatch<React.SetStateAction<Type17Container[]>> = (val) => {
    setContainers((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      const stateToSave = {
        messageContent,
        containers: JSON.parse(JSON.stringify(containers))
      };
      localStorage.setItem(`rng_server_embed_builder_${serverId}`, JSON.stringify(stateToSave));
      setSavedState(stateToSave);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleReset = () => {
    setMessageContent(savedState.messageContent);
    setContainers(JSON.parse(JSON.stringify(savedState.containers)));
    setIsDirty(false);
  };


  // Load template into builder (1-click green button)
  const handleLoadTemplate = (state: { message: { content: string }; type17Containers: Type17Container[] }) => {
    if (isDirty) {
      const proceed = window.confirm('You have unsaved changes! Discard your changes and load this template?');
      if (!proceed) return;
    }
    setMessageContent(state.message?.content || '');
    setContainers(JSON.parse(JSON.stringify(state.type17Containers || [])));
    setIsDirty(true);
  };


  const handleDispatchPayload = async (data: {
    serverId: string;
    channelId: string;
    isScheduled: boolean;
    scheduleTime?: string;
  }) => {
    const payload = buildDiscordV2MessagePayload(containers, messageContent);
    const targetServerId = (server && server.id) ? server.id : (data.serverId || serverId);
    if (data.isScheduled) {
      await api.scheduleEmbedDispatch({
        serverId: targetServerId,
        channelId: data.channelId,
        payload: payload as unknown as Record<string, unknown>,
        scheduledTime: data.scheduleTime,
        scheduledFor: data.scheduleTime,
      });
    } else {
      await api.dispatchEmbedJson({
        serverId: targetServerId,
        channelId: data.channelId,
        payload: payload as unknown as Record<string, unknown>,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  return (
    <div className="main-workspace w-full h-[calc(100vh-110px)] flex flex-col overflow-hidden">
      {/* Top Header Bar for Scoped Server with Glowing Tabs */}
      <header className="relative flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            className={`relative flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              activeTopTab === 'builder'
                ? 'text-white bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
            onClick={() => {
              setActiveTopTab('builder');
              loadActions();
            }}
          >
            <Boxes size={16} className={activeTopTab === 'builder' ? 'text-red-400' : 'text-zinc-500'} />
            <span>Components V2 Builder</span>
            {activeTopTab === 'builder' && (
              <motion.div
                layoutId="embedTopActiveTabIndicator"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute -bottom-3 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
              />
            )}
          </button>

          <button
            type="button"
            className={`relative flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              activeTopTab === 'templates'
                ? 'text-white bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
            onClick={() => setActiveTopTab('templates')}
          >
            <Layers size={16} className={activeTopTab === 'templates' ? 'text-amber-400' : 'text-zinc-500'} />
            <span>Templates</span>
            {activeTopTab === 'templates' && (
              <motion.div
                layoutId="embedTopActiveTabIndicator"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute -bottom-3 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
              />
            )}
          </button>

          <button
            type="button"
            className={`relative flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              activeTopTab === 'actions'
                ? 'text-white bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.25)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
            onClick={() => setActiveTopTab('actions')}
          >
            <Zap size={16} className={activeTopTab === 'actions' ? 'text-cyan-400' : 'text-zinc-500'} />
            <span>Action Templates</span>
            {activeTopTab === 'actions' && (
              <motion.div
                layoutId="embedTopActiveTabIndicator"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute -bottom-3 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
              />
            )}
          </button>
        </div>
      </header>

      {/* Main Tab Panels */}
      {activeTopTab === 'builder' && (
        <MessageBuilder
          containers={containers}
          setContainers={handleSetContainers}
          messageContent={messageContent}
          setMessageContent={handleSetMessageContent}
          onLoadTemplate={handleLoadTemplate}
          onDirtyChange={() => setIsDirty(true)}
          serverId={(server && server.id) ? server.id : serverId}
          serverName={server?.name}
          serverChannels={channels}
          serverEmojis={serverEmojis}
          botEmojis={botEmojis}
          onDispatchPayload={handleDispatchPayload}
          lockServer={true}
          availableActions={availableActions}
          serverScopedActions={availableActions}
        />
      )}

      {activeTopTab === 'templates' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TemplatesTab
            serverId={serverId}
            currentBuilderState={{
              message: { content: messageContent },
              type17Containers: containers
            }}
            onLoadTemplate={(tpl) => {
              handleLoadTemplate(tpl);
              setActiveTopTab('builder');
            }}
          />
        </div>
      )}

      {activeTopTab === 'actions' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ActionTemplatesTab
            serverId={serverId}
            onSelectAction={() => {
              loadActions();
            }}
            onActionsUpdated={loadActions}
          />
        </div>
      )}

      {/* Floating Discord-styled Unsaved Changes Action Bar */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        message="Careful — you have unsaved changes in Server Embed Builder!"
      />

    </div>
  );
}
