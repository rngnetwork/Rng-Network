"use client";

import React, { useState } from 'react';
import '@/components/embeds/embed-builder.css';
import { Type17Container } from '@/components/embeds/types';
import { MessageBuilder } from '@/components/embeds/MessageBuilder';
import { TemplatesTab } from '@/components/embeds/TemplatesTab';
import { ComponentsTab } from '@/components/embeds/ComponentsTab';

const INITIAL_SAMPLE_STATE = {
  messageContent: "Welcome to the RNG Discord Components V2 control center.",
  containers: [
    {
      id: "c17_init_1",
      accentColor: "#E11D2E",
      isSpoiler: false,
      author: { name: "RNG Network", icon_url: "" },
      title: "🚀 Discord Components V2 Engine",
      description: "Interactive message builder supporting official Type 17 Containers, Action Rows, Buttons, and Select Menus with complete live preview.",
      fields: [
        { name: "⚡ V2 Flags", value: "IS_COMPONENTS_V2 (32768)", inline: true },
        { name: "🛡️ Theme", value: "RNG Signature Red", inline: true }
      ],
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
  const [activeTopTab, setActiveTopTab] = useState<'builder' | 'templates' | 'components'>('builder');
  const [messageContent, setMessageContent] = useState(INITIAL_SAMPLE_STATE.messageContent);
  const [containers, setContainers] = useState<Type17Container[]>(INITIAL_SAMPLE_STATE.containers);

  // Copy JSON shortcut
  const handleCopyJson = () => {
    const payload = {
      content: messageContent || undefined,
      flags: 32768,
      components: containers.map(c => ({
        type: 17,
        accent_color: parseInt((c.accentColor || '#E11D2E').replace('#', ''), 16) || 14753070,
        spoiler: Boolean(c.isSpoiler),
        components: c.components
      }))
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    alert('Discord Components V2 JSON copied to clipboard!');
  };

  // Reset to default sample
  const handleResetToSample = () => {
    if (confirm('Reset canvas to default Discord Components V2 sample?')) {
      setMessageContent(INITIAL_SAMPLE_STATE.messageContent);
      setContainers(JSON.parse(JSON.stringify(INITIAL_SAMPLE_STATE.containers)));
    }
  };

  // Load a template into the builder
  const handleLoadTemplate = (state: { message: { content: string }; type17Containers: Type17Container[] }) => {
    setMessageContent(state.message?.content || '');
    setContainers(JSON.parse(JSON.stringify(state.type17Containers || [])));
    setActiveTopTab('builder');
  };

  // Insert component from Components Tab
  const handleInsertComponentFromCatalog = (typeNum: number) => {
    setActiveTopTab('builder');
    // Handled in MessageBuilder via palette or state append
    if (containers.length === 0) {
      setContainers([
        {
          id: `c17_${Date.now()}`,
          accentColor: '#E11D2E',
          isSpoiler: false,
          components: [{ type: typeNum as any, id: `comp_${Date.now()}` } as any]
        }
      ]);
    } else {
      const upd = [...containers];
      upd[0].components.push({ type: typeNum as any, id: `comp_${Date.now()}` } as any);
      setContainers(upd);
    }
  };

  return (
    <div className="main-workspace" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation Tabs Bar */}
      <header className="top-nav-bar">
        <div className="main-tabs-group">
          <button
            type="button"
            className={`main-tab-btn ${activeTopTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('builder')}
          >
            <i className="fa-solid fa-cube" />
            <span>Components V2 Builder</span>
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

        <div className="top-nav-actions">
          <div className="status-pill">
            <div className="status-indicator-dot" />
            <span>IS_COMPONENTS_V2 (32768)</span>
          </div>

          <button
            type="button"
            className="btn-header-action"
            onClick={handleCopyJson}
            title="Copy Discord JSON Payload"
          >
            <i className="fa-regular fa-copy" />
            <span>Copy JSON</span>
          </button>
          <button
            type="button"
            className="btn-header-action"
            onClick={handleResetToSample}
            title="Reset to Defaults"
          >
            <i className="fa-solid fa-rotate-left" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Main Tab Panels */}
      {activeTopTab === 'builder' && (
        <MessageBuilder
          containers={containers}
          setContainers={setContainers}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          onLoadTemplate={handleLoadTemplate}
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

      {activeTopTab === 'components' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ComponentsTab
            onInsertComponent={handleInsertComponentFromCatalog}
          />
        </div>
      )}

    </div>
  );
}
