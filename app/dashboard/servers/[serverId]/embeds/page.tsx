"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import '@/components/embeds/embed-builder.css';
import { Type17Container, DiscordInnerComponent } from '@/components/embeds/types';
import { MessageBuilder } from '@/components/embeds/MessageBuilder';
import { TemplatesTab } from '@/components/embeds/TemplatesTab';
import { ComponentsTab } from '@/components/embeds/ComponentsTab';
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
  const [activeTopTab, setActiveTopTab] = useState<'builder' | 'templates' | 'components'>('builder');

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
    setActiveTopTab('builder');
  };

  // Insert component from catalog into builder (1-click green button)
  const handleInsertComponentFromCatalog = (item: number | DiscordInnerComponent) => {
    setActiveTopTab('builder');
    setIsDirty(true);
    const newComp = typeof item === 'number'
      ? ({ type: item as DiscordInnerComponent['type'], id: `comp_${Date.now()}` } as DiscordInnerComponent)
      : JSON.parse(JSON.stringify(item));

    if (containers.length === 0) {
      setContainers([
        {
          id: `c17_${Date.now()}`,
          accentColor: '#E11D2E',
          isSpoiler: false,
          components: [newComp]
        }
      ]);
    } else {
      const upd = [...containers];
      upd[0].components.push(newComp);
      setContainers(upd);
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
    <div className="embed-builder-root" style={{ minHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation Bar: [ Message Builder ] [ Templates ] [ Components ] */}
      <header className="builder-top-nav" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="main-tabs-cluster">
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('builder')}
          >
            <i className="fa-solid fa-code" />
            <span>Message Builder</span>
          </button>
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('templates')}
          >
            <i className="fa-solid fa-layer-group" />
            <span>Templates</span>
          </button>
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('components')}
          >
            <i className="fa-solid fa-puzzle-piece" />
            <span>Components</span>
          </button>
        </div>

        {server && (
          <div className="top-nav-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-pill" style={{ background: 'rgba(225, 29, 46, 0.1)', borderColor: 'rgba(225, 29, 46, 0.3)', color: '#FF3B4D' }}>
              <i className="fa-solid fa-server" />
              <span>{server.name}</span>
            </div>
          </div>
        )}
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
          serverId={serverId}
          serverName={server?.name}
          serverChannels={channels}
          serverEmojis={serverEmojis}
        />
      )}

      {activeTopTab === 'templates' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TemplatesTab
            currentBuilderState={{
              message: { content: messageContent },
              type17Containers: containers
            }}
            onLoadTemplate={handleLoadTemplate}
            allowCreate={false}
            allowSearch={false}
          />
        </div>
      )}

      {activeTopTab === 'components' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ComponentsTab
            onInsertComponent={handleInsertComponentFromCatalog}
            allowCreate={false}
            allowSearch={false}
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
