"use client";

import React, { useState, useEffect, useCallback } from 'react';
import '@/components/embeds/embed-builder.css';
import { Type17Container, EmbedAction } from '@/components/embeds/types';
import { MessageBuilder } from '@/components/embeds/MessageBuilder';
import { TemplatesTab } from '@/components/embeds/TemplatesTab';
import { ActionTemplatesTab } from '@/components/embeds/ActionTemplatesTab';
import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';
import { api, ServerItem, ChannelItem } from '@/lib/api';
import { EmojiItem } from '@/components/embeds/emoji-data';
import { buildDiscordV2MessagePayload } from '@/components/embeds/validation';

export default function EmbedsPage() {
  const [activeTopTab, setActiveTopTab] = useState<'builder' | 'templates' | 'actions'>('builder');
  const [messageContent, setMessageContent] = useState("");
  const [containers, setContainers] = useState<Type17Container[]>([]);
  const [botEmojis] = useState<EmojiItem[]>([]);

  // Unsaved Changes Tracking
  const [savedState, setSavedState] = useState({
    messageContent: "",
    containers: [] as Type17Container[]
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      localStorage.setItem('rng_embed_builder_saved', JSON.stringify(stateToSave));
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


  // Dynamic Servers and Channels state
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [serverChannels, setServerChannels] = useState<ChannelItem[]>([]);
  const [availableActions, setAvailableActions] = useState<EmbedAction[]>([]);

  const loadActions = useCallback(async () => {
    try {
      const res = await api.fetchActionTemplates();
      if (res.success && res.data) {
        setAvailableActions(res.data);
      }
    } catch (e) {
      console.warn('Failed to load action templates:', e);
    }
  }, []);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const loadChannelsForServer = useCallback(async (srvId: string) => {
    if (!srvId) return;
    try {
      const res = await api.fetchDispatchChannels(srvId);
      if (res.success && res.data) {
        setServerChannels(res.data);
      }
    } catch (e) {
      console.warn('Failed to load channels for server:', srvId, e);
    }
  }, []);

  useEffect(() => {
    const initServers = async () => {
      try {
        const res = await api.fetchServers();
        if (res.success && res.data && res.data.length > 0) {
          setServers(res.data);
          const firstId = res.data[0].id;
          setSelectedServerId(firstId);
          await loadChannelsForServer(firstId);
        }
      } catch (err) {
        console.warn('Failed to load available servers:', err);
      }
    };
    initServers();
  }, [loadChannelsForServer]);


  const handleSelectServer = async (newServerId: string) => {
    setSelectedServerId(newServerId);
    await loadChannelsForServer(newServerId);
  };

  const handleDispatchPayload = async (data: {
    serverId: string;
    channelId: string;
    isScheduled: boolean;
    scheduleTime?: string;
  }) => {
    const payload = buildDiscordV2MessagePayload(containers, messageContent);
    const targetServerId = data.serverId || selectedServerId;
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

  // Load a template into the builder
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

  return (
    <div className="main-workspace w-full h-[calc(100vh-110px)] flex flex-col overflow-hidden">
      
      {/* Top Navigation Tabs Bar */}
      <header className="top-nav-bar">
        <div className="main-tabs-group">
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('builder')}
          >
            <i className="fa-solid fa-cube text-red-500" />
            <span>Components V2 Builder</span>
          </button>
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('templates')}
          >
            <i className="fa-solid fa-layer-group text-amber-400" />
            <span>Templates</span>
          </button>
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('actions')}
          >
            <i className="fa-solid fa-bolt text-cyan-400" />
            <span>Action Templates</span>
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
          availableServers={servers}
          serverChannels={serverChannels}
          serverId={selectedServerId}
          serverName={servers.find((s) => s.id === selectedServerId)?.name}
          botEmojis={botEmojis}
          onSelectServer={handleSelectServer}
          onDispatchPayload={handleDispatchPayload}
          lockServer={false}
          availableActions={availableActions}
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
          />
        </div>
      )}

      {activeTopTab === 'actions' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ActionTemplatesTab
            serverId={selectedServerId}
            onSelectAction={() => {
              loadActions();
            }}
          />
        </div>
      )}

      {/* Floating Discord-styled Unsaved Changes Action Bar */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        message="Careful — you have unsaved changes in Message Builder!"
      />

    </div>
  );
}
