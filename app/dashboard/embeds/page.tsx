"use client";

import React, { useState } from 'react';
import '@/components/embeds/embed-builder.css';
import { Type17Container } from '@/components/embeds/types';
import { MessageBuilder } from '@/components/embeds/MessageBuilder';
import { TemplatesTab } from '@/components/embeds/TemplatesTab';

import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';

const INITIAL_SAMPLE_STATE = {
  messageContent: "Welcome to the RNG Discord Components V2 control center.",
  containers: [
    {
      id: "c17_init_1",
      accentColor: "#00A8FC",
      isSpoiler: false,
      author: { name: "RNG Network", icon_url: "" },
      title: "🚀 Discord Components V2 Engine",
      description: "Interactive message builder supporting official Type 17 Containers, Action Rows, Buttons, and Select Menus with complete live preview.",
      fields: [
        { name: "⚡ V2 Flags", value: "IS_COMPONENTS_V2 (32768)", inline: true },
        { name: "🛡️ Theme", value: "Discord Authentic Dark", inline: true }
      ],
      thumbnail: "",
      image: "",
      footer: { text: "RNG Network • Components V2 Specification", icon_url: "" },
      components: [
        {
          type: 10 as const,
          id: "txt_features",
          text: "### ✨ Core Capabilities\n• Drag and drop reordering\n• Unicode + Custom Bot Emojis\n• 1:1 Live Discord simulator"
        },
        {
          type: 1 as const,
          id: "row_actions",
          label: "CONTROLS",
          items: [
            { type: 2 as const, style: 1 as const, label: "Explore Features", emoji: "🚀", custom_id: "btn_explore" },
            { type: 2 as const, style: 3 as const, label: "Official Docs", emoji: "📖", custom_id: "btn_docs" },
            { type: 2 as const, style: 5 as const, label: "Portal", emoji: "🌐", url: "https://rng.gg" }
          ]
        },
        {
          type: 14 as const,
          id: "sep_init",
          divider: true,
          spacing: 2 as const
        },
        {
          type: 3 as const,
          id: "sel_init",
          custom_id: "sel_quick_actions",
          placeholder: "Choose an automated workflow...",
          options: [
            { label: "Verify Membership", value: "opt_verify", emoji: "✅", description: "Automated role assign", default: false },
            { label: "Get Help", value: "opt_support", emoji: "🎫", description: "Create staff ticket", default: false }
          ]
        }
      ]
    }
  ]
};

export default function EmbedsPage() {
  const [activeTopTab, setActiveTopTab] = useState<'builder' | 'templates'>('builder');
  const [messageContent, setMessageContent] = useState(INITIAL_SAMPLE_STATE.messageContent);
  const [containers, setContainers] = useState<Type17Container[]>(INITIAL_SAMPLE_STATE.containers);

  // Unsaved Changes Tracking
  const [savedState, setSavedState] = useState({
    messageContent: INITIAL_SAMPLE_STATE.messageContent,
    containers: JSON.parse(JSON.stringify(INITIAL_SAMPLE_STATE.containers))
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
    <div className="main-workspace w-full" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      
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
