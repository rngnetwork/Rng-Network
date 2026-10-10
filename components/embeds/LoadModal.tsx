"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Type17Container, DiscordInnerComponent, BackendEmbedTemplate } from './types';
import { api } from '@/lib/api';
import { parseDiscordPayloadToState } from './validation';

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (state: { message: { content: string }; type17Containers: Type17Container[] }) => void;
  onLoadComponent: (comp: DiscordInnerComponent) => void;
  serverId?: string;
}

interface LoadedSavedTemplate {
  id: string;
  badge: string;
  name: string;
  desc: string;
  isPublic?: boolean;
  containerCount: number;
  componentCount: number;
  state: {
    message: { content: string };
    type17Containers: Type17Container[];
  };
}

export function LoadModal({
  isOpen,
  onClose,
  onLoadTemplate,
  onLoadComponent,
  serverId
}: LoadModalProps) {
  const [activeTab, setActiveTab] = useState<'saved' | 'presets' | 'components'>('saved');
  const [savedTemplates, setSavedTemplates] = useState<LoadedSavedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

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
        id: 'sample_row_action',
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
        id: 'sample_sel_menu',
        custom_id: 'menu_interactive',
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
        id: 'sample_sec_card',
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
        id: 'sample_sep_divider',
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
        id: 'sample_txt_content',
        text: '### 🛡️ Autonomous Discord Protection\n> Real-time anti-nuke and moderation controls enabled.\n*Powered by RNG Control Center.*'
      }
    }
  ];

  const loadSavedTemplates = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const effectiveServerId = serverId && serverId !== 'default' ? serverId : undefined;
      const [serverRes, publicRes] = await Promise.all([
        effectiveServerId ? api.fetchTemplates({ serverId: effectiveServerId, size: 100 }) : api.fetchTemplates({ size: 100 }),
        api.fetchTemplates({ size: 100 })
      ]);

      const extractItems = (response: any): BackendEmbedTemplate[] => {
        if (!response?.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data.content)) return response.data.content;
        return [];
      };

      const serverItems = extractItems(serverRes);
      const publicItems = extractItems(publicRes);

      const seenKeys = new Set<string>();
      const uniqueTemplates: BackendEmbedTemplate[] = [];

      [...serverItems, ...publicItems].forEach((bt) => {
        const tId = bt.templateId ? String(bt.templateId).trim() : undefined;
        const mId = bt.id ? String(bt.id).trim() : undefined;
        const key = tId || mId;
        if (!key) return;

        if (seenKeys.has(key) || (tId && seenKeys.has(tId)) || (mId && seenKeys.has(mId))) {
          return;
        }

        if (tId) seenKeys.add(tId);
        if (mId) seenKeys.add(mId);
        uniqueTemplates.push(bt);
      });

      const parsedList: LoadedSavedTemplate[] = uniqueTemplates.map((bt) => {
        const p = (bt.payload || bt.payloadJson || {}) as Record<string, unknown>;
        let containers: Type17Container[] = [];
        let content = '';

        if (Array.isArray(p.containers)) {
          containers = p.containers as Type17Container[];
          content = String(p.content || p.builderContent || '');
        } else if (Array.isArray(p.components)) {
          try {
            const parsed = parseDiscordPayloadToState(p);
            containers = parsed.containers || [];
            content = parsed.messageContent || '';
          } catch {
            containers = [];
          }
        }

        const compCount = containers.reduce((acc, c) => acc + (c.components?.length || 0), 0);

        return {
          id: bt.templateId || bt.id || String(Math.random()),
          name: bt.name || 'Untitled Template',
          desc: bt.description || 'Custom template from database',
          badge: (bt as any).badge || bt.category || (bt.isPublic ? 'Public' : 'Custom'),
          isPublic: bt.isPublic,
          containerCount: containers.length,
          componentCount: compCount,
          state: {
            message: { content },
            type17Containers: containers
          }
        };
      });

      setSavedTemplates(parsedList);
    } catch (err: any) {
      console.error('Error fetching templates in LoadModal:', err);
      setFetchError('Failed to load saved templates from server.');
    } finally {
      setIsLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    if (isOpen) {
      loadSavedTemplates();
    }
  }, [isOpen, loadSavedTemplates]);

  const filteredSavedTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return savedTemplates;
    return savedTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q)
    );
  }, [savedTemplates, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backdropFilter: 'blur(14px)',
        background: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '720px',
          width: '100%',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(34, 197, 94, 0.12)'
        }}
      >
        <div className="modal-header">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-cloud-arrow-down" style={{ color: '#4ade80', fontSize: '14px' }} />
            </div>
            <span>Load Templates & Presets</span>
          </div>
          <button className="btn-container-close" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Top Mode Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn-style-chip ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
              style={{
                padding: '6px 16px',
                fontSize: '12.5px',
                borderRadius: '8px',
                border: activeTab === 'saved' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === 'saved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'saved' ? '#4ade80' : '#949ba4',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-database" style={{ marginRight: '6px' }} />
              Saved Templates ({savedTemplates.length})
            </button>

            <button
              type="button"
              className={`btn-style-chip ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
              style={{
                padding: '6px 16px',
                fontSize: '12.5px',
                borderRadius: '8px',
                border: activeTab === 'presets' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === 'presets' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'presets' ? '#4ade80' : '#949ba4',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }} />
              Pre-built Presets ({sampleTemplates.length})
            </button>

            <button
              type="button"
              className={`btn-style-chip ${activeTab === 'components' ? 'active' : ''}`}
              onClick={() => setActiveTab('components')}
              style={{
                padding: '6px 16px',
                fontSize: '12.5px',
                borderRadius: '8px',
                border: activeTab === 'components' ? '1px solid #5865F2' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === 'components' ? 'rgba(88, 101, 242, 0.15)' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'components' ? '#5865F2' : '#949ba4',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-cube" style={{ marginRight: '6px' }} />
              Components ({sampleComponents.length})
            </button>
          </div>

          {activeTab === 'saved' && (
            <button
              type="button"
              onClick={loadSavedTemplates}
              disabled={isLoading}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#949ba4',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Refresh templates from server"
            >
              <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Search bar for Saved Templates */}
        {activeTab === 'saved' && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '12px'
                }}
              />
              <input
                type="text"
                placeholder="Search saved templates by name, badge, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '7px 12px 7px 34px',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px 20px' }}>
          {activeTab === 'saved' ? (
            isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#949ba4' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: '#22c55e', marginBottom: '12px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Fetching templates from server...</div>
                <div style={{ fontSize: '11.5px', marginTop: '4px' }}>Loading stored embed layouts</div>
              </div>
            ) : fetchError ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444', fontSize: '20px', marginBottom: '8px' }} />
                <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 600 }}>{fetchError}</div>
                <button
                  type="button"
                  onClick={loadSavedTemplates}
                  style={{
                    marginTop: '10px',
                    padding: '5px 14px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : filteredSavedTemplates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#949ba4' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <i className="fa-solid fa-folder-open" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.3)' }} />
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>
                  {searchQuery ? 'No matching templates found' : 'No saved templates found'}
                </div>
                <div style={{ fontSize: '11.5px', marginTop: '4px', maxWidth: '360px', margin: '4px auto 0' }}>
                  {searchQuery
                    ? `No templates matched "${searchQuery}". Try a different keyword.`
                    : 'Save your customized embeds as templates in the Templates tab to reload them here anytime.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredSavedTemplates.map((tmpl) => (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className="template-badge"
                          style={{
                            background: tmpl.isPublic ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: tmpl.isPublic ? '#38bdf8' : '#4ade80',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {tmpl.badge}
                        </span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          {tmpl.containerCount} Container{tmpl.containerCount === 1 ? '' : 's'} • {tmpl.componentCount} Comp{tmpl.componentCount === 1 ? '' : 's'}
                        </span>
                      </div>
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
            )
          ) : activeTab === 'presets' ? (
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
                      const cloned = JSON.parse(JSON.stringify(item.comp));
                      cloned.id = `${item.comp.id}_${Date.now()}`;
                      onLoadComponent(cloned);
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
