"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import '@/components/embeds/embed-builder.css';
import { Type17Container } from '@/components/embeds/types';
import { MessageBuilder } from '@/components/embeds/MessageBuilder';
import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';
import { api, ServerDetail, ChannelItem } from '@/lib/api';
import { getServerEmojis } from '@/components/embeds/emoji-data';

const INITIAL_SERVER_SAMPLE_STATE = {
  messageContent: "Welcome to this server! Powered by RNG Discord Components V2.",
  containers: [
    {
      id: "c17_srv_init_1",
      accentColor: "#E11D2E",
      isSpoiler: false,
      author: { name: "Server Broadcast", icon_url: "" },
      title: "📡 Official Server Dispatch",
      description: "Interactive server communication with official Type 17 Containers, Action Rows, Buttons, and Select Menus.",
      fields: [
        { name: "⚡ V2 Flags", value: "IS_COMPONENTS_V2 (32768)", inline: true },
        { name: "🛡️ Channel Sync", value: "Live Server Integration", inline: true }
      ],
      thumbnail: "",
      image: "",
      footer: { text: "Server Management • Components V2 Specification", icon_url: "" },
      components: [
        {
          type: 10 as const,
          id: "txt_srv_desc",
          text: "### 📢 Server Announcements & Information\n• Custom server emojis ready\n• Scheduled & instant message delivery\n• Load pre-built templates or components with 1-click"
        },
        {
          type: 1 as const,
          id: "row_srv_actions",
          label: "QUICK ACTIONS",
          items: [
            { type: 2 as const, style: 3 as const, label: "Confirm Access", emoji: "✅", custom_id: "btn_server_verify" },
            { type: 2 as const, style: 1 as const, label: "Server Guidelines", emoji: "📜", custom_id: "btn_server_rules" },
            { type: 2 as const, style: 5 as const, label: "Portal", emoji: "🌐", url: "https://rng.gg" }
          ]
        }
      ]
    }
  ]
};

export default function ServerEmbedsPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerDetail | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Top level active tab: 'builder' | 'templates' | 'components'


  // Active message content & Type 17 Containers
  const [messageContent, setMessageContent] = useState<string>(INITIAL_SERVER_SAMPLE_STATE.messageContent);
  const [containers, setContainers] = useState<Type17Container[]>(INITIAL_SERVER_SAMPLE_STATE.containers);

  // Unsaved changes tracking
  const [savedState, setSavedState] = useState<{ messageContent: string; containers: Type17Container[] }>({
    messageContent: INITIAL_SERVER_SAMPLE_STATE.messageContent,
    containers: JSON.parse(JSON.stringify(INITIAL_SERVER_SAMPLE_STATE.containers))
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch server details and server channels
  useEffect(() => {
    let isMounted = true;

    const loadServerData = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [serverRes, channelsRes] = await Promise.allSettled([
          api.fetchServerDetails(token, serverId),
          api.fetchServerChannels(token, serverId)
        ]);

        if (isMounted) {
          if (serverRes.status === 'fulfilled' && serverRes.value.success && serverRes.value.data) {
            setServer(serverRes.value.data);
          }
          if (channelsRes.status === 'fulfilled' && channelsRes.value.success && channelsRes.value.data) {
            setChannels(channelsRes.value.data);
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

  // Load server-specific custom emojis (with default fallback & localStorage cache)
  const serverEmojis = useMemo(() => {
    return getServerEmojis(serverId, server?.name);
  }, [serverId, server?.name]);

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


  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  return (
    <div className="main-workspace w-full" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar for Scoped Server */}
      <header className="top-nav-bar">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 shadow-inner">
            <i className="fa-brands fa-discord text-indigo-400 text-sm" />
            <span className="text-xs font-bold text-white tracking-wide">
              {server?.name || `Server ${serverId}`}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
              {channels.length} channels
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-zinc-600">•</span>
            <span>Components V2 Scoped Server Dispatch</span>
          </div>
        </div>

        <div className="top-nav-actions">
          <div className="status-pill">
            <span className="status-indicator-dot" />
            <span>Server Synced</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11.5px] text-zinc-400 font-mono">
            <span className="text-red-400 font-bold">{containers.length}</span>
            <span>Container{containers.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </header>

      {/* Main Tab Panels */}
      <MessageBuilder
        containers={containers}
        setContainers={handleSetContainers}
        messageContent={messageContent}
        setMessageContent={handleSetMessageContent}
        onLoadTemplate={handleLoadTemplate}
        onDirtyChange={() => setIsDirty(true)}
        serverId={serverId}
        serverName={server?.name}
        serverChannels={channels}
        serverEmojis={serverEmojis}
      />

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
