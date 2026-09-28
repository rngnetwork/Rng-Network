"use client";

import React, { useState } from 'react';
import { Type17Container, DiscordInnerComponent } from './types';

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (state: { message: { content: string }; type17Containers: Type17Container[] }) => void;
  onLoadComponent: (comp: DiscordInnerComponent) => void;
}

export function LoadModal({
  isOpen,
  onClose,
  onLoadTemplate,
  onLoadComponent
}: LoadModalProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'components'>('templates');

  if (!isOpen) return null;

  const sampleTemplates = [
    {
      id: 'onboarding_role_gate',
      badge: 'Onboarding',
      name: 'RNG Rules & Role Gate',
      desc: 'Type 17 Container with verification buttons and automated role select menu.',
      state: {
        message: { content: 'Welcome to **RNG Network**! Please review the server guidelines below and verify to unlock access.' },
        type17Containers: [
          {
            id: 'c17_gate',
            accentColor: '#E11D2E',
            isSpoiler: false,
            author: { name: 'RNG High Command', icon_url: '' },
            title: 'Official Server Guidelines & Verification',
            description: 'By joining our network you agree to maintain community standards.\n\n• Respect all server members and staff.\n• No unsolicited spam or self-promotion.\n• Follow Discord Terms of Service.',
            fields: [
              { name: 'Channel Access', value: 'Complete verification below to receive member privileges.', inline: true },
              { name: 'Support', value: 'Open a ticket in #support if you encounter any issues.', inline: true }
            ],
            thumbnail: '',
            image: '',
            footer: { text: 'RNG Network • Autonomous Security', icon_url: '' },
            components: [
              {
                type: 1 as const,
                id: 'row_verify',
                label: 'VERIFICATION CONTROLS',
                items: [
                  { type: 2 as const, style: 3 as const, label: 'Verify Access', emoji: '✅', custom_id: 'btn_verify_access' },
                  { type: 2 as const, style: 2 as const, label: 'Server Rules', emoji: '📜', custom_id: 'btn_read_rules' },
                  { type: 2 as const, style: 5 as const, label: 'Official Portal', emoji: '🌐', url: 'https://rng.gg' }
                ]
              },
              {
                type: 14 as const,
                id: 'sep_gate',
                divider: true,
                spacing: 2 as const
              },
              {
                type: 3 as const,
                id: 'sel_roles',
                custom_id: 'sel_ping_roles',
                placeholder: 'Choose your optional notification roles...',
                options: [
                  { label: 'Announcements Ping', value: 'role_announcements', emoji: '🔔', description: 'Major updates and broadcasts', default: false },
                  { label: 'Events & Tournaments', value: 'role_events', emoji: '🏆', description: 'Community competition alerts', default: false },
                  { label: 'Changelog Alerts', value: 'role_changelog', emoji: '📦', description: 'Bot and network version logs', default: false }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      id: 'support_hub',
      badge: 'Support',
      name: 'Automated Support & Ticket Hub',
      desc: 'Interactive launcher with action rows and priority indicators.',
      state: {
        message: { content: 'Need assistance? The **RNG Support Team** is available 24/7.' },
        type17Containers: [
          {
            id: 'c17_support',
            accentColor: '#5865F2',
            isSpoiler: false,
            author: { name: 'RNG Help Desk', icon_url: '' },
            title: 'Create a Support Ticket',
            description: 'Select a category matching your inquiry to instantly dispatch a dedicated staff channel.',
            fields: [
              { name: 'Average Response Time', value: '< 5 Minutes', inline: true },
              { name: 'Operating Status', value: '🟢 All Systems Operational', inline: true }
            ],
            thumbnail: '',
            image: '',
            footer: { text: 'Tickets are confidential and logged for quality control.', icon_url: '' },
            components: [
              {
                type: 1 as const,
                id: 'row_support',
                items: [
                  { type: 2 as const, style: 1 as const, label: 'Billing & Store', emoji: '💳', custom_id: 'ticket_billing' },
                  { type: 2 as const, style: 2 as const, label: 'Bug Report', emoji: '🐛', custom_id: 'ticket_bug' },
                  { type: 2 as const, style: 4 as const, label: 'Player Report', emoji: '🛡️', custom_id: 'ticket_report' }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      id: 'announcement_changelog',
      badge: 'Announcement',
      name: 'Network Update & Changelog',
      desc: 'Multi-field showcase container with interactive patch links.',
      state: {
        message: { content: '@everyone **Version 2.4.0 is now live across all servers!**' },
        type17Containers: [
          {
            id: 'c17_update',
            accentColor: '#23A55A',
            isSpoiler: false,
            author: { name: 'RNG Changelog Dispatcher', icon_url: '' },
            title: '🚀 Update 2.4.0: Discord Components V2 Engine',
            description: 'We have completely overhauled our bot interaction system to utilize official Type 17 Containers and dynamic Component action rows.',
            fields: [
              { name: '✨ New Features', value: '• Type 17 Container Builder\n• Real-time WYSIWYG Discord preview\n• Full Unicode & Bot Emoji support', inline: false },
              { name: '⚡ Optimizations', value: '• Sub-50ms message rendering\n• Redis distributed caching', inline: false }
            ],
            thumbnail: '',
            image: '',
            footer: { text: 'RNG Systems Engine • Build #8942', icon_url: '' },
            components: [
              {
                type: 1 as const,
                id: 'row_update',
                items: [
                  { type: 2 as const, style: 5 as const, label: 'Read Full Patch Notes', emoji: '📖', url: 'https://rng.gg/changelog' },
                  { type: 2 as const, style: 2 as const, label: 'Report Issues', emoji: '💬', custom_id: 'btn_report_update' }
                ]
              }
            ]
          }
        ]
      }
    }
  ];

  const sampleComponents: { name: string; typeNum: number; desc: string; comp: DiscordInnerComponent }[] = [
    {
      name: 'Primary Action Row (5 Buttons)',
      typeNum: 1,
      desc: 'Row with Blurple, Grey, Green, Danger Red, and Link buttons.',
      comp: {
        type: 1,
        id: `row_${Date.now()}`,
        label: 'ACTION CONTROLS',
        items: [
          { type: 2, style: 1, label: 'Primary', custom_id: 'btn_1' },
          { type: 2, style: 2, label: 'Secondary', custom_id: 'btn_2' },
          { type: 2, style: 3, label: 'Success', custom_id: 'btn_3' },
          { type: 2, style: 4, label: 'Danger', custom_id: 'btn_4' },
          { type: 2, style: 5, label: 'Link', url: 'https://discord.com' }
        ]
      }
    },
    {
      name: 'Dynamic String Select Menu',
      typeNum: 3,
      desc: 'Interactive dropdown with custom options and emoji badges.',
      comp: {
        type: 3,
        id: `sel_${Date.now()}`,
        custom_id: `menu_${Date.now()}`,
        placeholder: 'Choose your selection...',
        options: [
          { label: 'Option Alpha', value: 'opt_alpha', emoji: '⭐', description: 'Primary recommendation', default: true },
          { label: 'Option Beta', value: 'opt_beta', emoji: '🔹', description: 'Secondary alternative', default: false },
          { label: 'Option Gamma', value: 'opt_gamma', emoji: '🚀', description: 'High performance tier', default: false }
        ]
      }
    },
    {
      name: 'Section with Thumbnail Accessory',
      typeNum: 9,
      desc: 'Section layout pairing markdown content with thumbnail media.',
      comp: {
        type: 9,
        id: `sec_${Date.now()}`,
        text: '### Featured Network Perks\nUnlock exclusive commands, custom roles, and priority server access.',
        accessory: {
          type: 'thumbnail',
          url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        }
      }
    },
    {
      name: 'Divider Separator (Large Spacing)',
      typeNum: 14,
      desc: 'Horizontal visual divider line with clean spacing.',
      comp: {
        type: 14,
        id: `sep_${Date.now()}`,
        divider: true,
        spacing: 2
      }
    },
    {
      name: 'Markdown Text Display',
      typeNum: 10,
      desc: 'Discord Components V2 content card supporting rich markdown syntax.',
      comp: {
        type: 10,
        id: `txt_${Date.now()}`,
        text: '### 🛡️ Autonomous Discord Protection\n> Real-time anti-nuke and moderation controls enabled.\n*Powered by RNG Control Center.*'
      }
    }
  ];

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-cloud-arrow-down" style={{ color: '#22c55e' }} />
            <span>Load Templates & Components</span>
          </div>
          <button className="btn-container-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Top Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            className={`btn-style-chip ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              borderRadius: '8px',
              border: activeTab === 'templates' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'templates' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.3)',
              color: activeTab === 'templates' ? '#4ade80' : '#949ba4'
            }}
          >
            <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} />
            Pre-built Templates ({sampleTemplates.length})
          </button>
          <button
            type="button"
            className={`btn-style-chip ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              borderRadius: '8px',
              border: activeTab === 'components' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'components' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.3)',
              color: activeTab === 'components' ? '#4ade80' : '#949ba4'
            }}
          >
            <i className="fa-solid fa-puzzle-piece" style={{ marginRight: '6px' }} />
            Component Presets ({sampleComponents.length})
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'templates' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sampleTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="template-card"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    onLoadTemplate(tmpl.state);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="template-badge" style={{ background: 'rgba(225, 29, 46, 0.15)', color: '#FF3B4D', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      {tmpl.badge}
                    </span>
                    <button
                      type="button"
                      className="btn-ctrl-green"
                      style={{ padding: '4px 12px', fontSize: '11.5px', borderRadius: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadTemplate(tmpl.state);
                        onClose();
                      }}
                    >
                      Load Template
                    </button>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{tmpl.name}</div>
                  <div style={{ fontSize: '12px', color: '#949ba4' }}>{tmpl.desc}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sampleComponents.map((item, idx) => (
                <div
                  key={`comp_preset_${idx}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.name}</span>
                      <span className="type-number-pill" style={{ background: '#5865F2', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>
                        Type {item.typeNum}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#949ba4' }}>{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-ctrl-green"
                    style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: '6px', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      onLoadComponent(item.comp);
                      onClose();
                    }}
                  >
                    + Insert
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
