'use client';

import React, { useState, useMemo } from 'react';
import { FolderOpen, Sparkles, Layers, Box, Check, Plus } from 'lucide-react';
import { Modal } from '@/components/common/feedback/Modal';
import { Badge } from '@/components/common/feedback/Badge';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';
import type { Type17Container, TemplateData, DiscordInnerComponent } from '@/lib/model/embed';
import { ComponentType } from '@/lib/model/embed';
import { parseDiscordPayloadToState } from '../useEmbedBuilderReducer';

export interface LoadPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTemplates: TemplateData[];
  onLoadTemplate: (
    state: { message: { content: string }; type17Containers: Type17Container[] },
    name?: string
  ) => void;
  onInsertComponent?: (comp: DiscordInnerComponent) => void;
}

const BUILTIN_PRESETS: Array<{
  id: string;
  name: string;
  badge: string;
  description: string;
  state: {
    message: { content: string };
    type17Containers: Type17Container[];
  };
}> = [
  {
    id: 'onboarding_role_gate',
    badge: 'Onboarding',
    name: 'RNG Rules & Role Gate',
    description: 'Type 17 Container with verification buttons and automated role select menu.',
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
            { name: 'Ministry Clearance', value: 'Personnel clearance is required for operations channels.', inline: true },
          ],
          thumbnail: '',
          image: '',
          footer: { text: 'RNG Network • Autonomous Security', icon_url: '' },
          components: [
            {
              type: ComponentType.ACTION_ROW,
              id: 'row_verify',
              label: 'VERIFICATION CONTROLS',
              components: [
                {
                  type: ComponentType.BUTTON,
                  id: 'btn_verify_access',
                  style: 3,
                  label: 'Verify Access',
                  custom_id: 'btn_verify_access',
                  emoji: '✅',
                },
                {
                  type: ComponentType.BUTTON,
                  id: 'btn_read_rules',
                  style: 2,
                  label: 'Server Rules',
                  custom_id: 'btn_read_rules',
                  emoji: '📜',
                },
                {
                  type: ComponentType.BUTTON,
                  id: 'btn_official_portal',
                  style: 5,
                  label: 'Official Portal',
                  url: 'https://rng.gg',
                  emoji: '🌐',
                },
              ],
            },
            {
              type: ComponentType.SEPARATOR,
              id: 'sep_gate',
              divider: true,
              spacing: 2,
            },
            {
              type: ComponentType.STRING_SELECT,
              id: 'sel_ping_roles',
              custom_id: 'sel_ping_roles',
              placeholder: 'Choose your optional notification roles...',
              options: [
                { label: 'Announcements Ping', value: 'role_announcements', emoji: '🔔', description: 'Major updates and broadcasts', default: false },
                { label: 'Events & Tournaments', value: 'role_events', emoji: '🏆', description: 'Community competition alerts', default: false },
                { label: 'Changelog Alerts', value: 'role_changelog', emoji: '📦', description: 'Bot and network version logs', default: false },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'support_hub',
    badge: 'Support',
    name: 'Automated Support & Ticket Hub',
    description: 'Interactive launcher with action rows and priority indicators.',
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
            { name: 'Operating Status', value: '🟢 All Systems Operational', inline: true },
          ],
          thumbnail: '',
          image: '',
          footer: { text: 'Tickets are confidential and logged for quality control.', icon_url: '' },
          components: [
            {
              type: ComponentType.ACTION_ROW,
              id: 'row_support',
              components: [
                { type: ComponentType.BUTTON, id: 'btn_billing', style: 1, label: 'Billing & Store', emoji: '💳', custom_id: 'ticket_billing' },
                { type: ComponentType.BUTTON, id: 'btn_bug', style: 2, label: 'Bug Report', emoji: '🐛', custom_id: 'ticket_bug' },
                { type: ComponentType.BUTTON, id: 'btn_report', style: 4, label: 'Player Report', emoji: '🛡️', custom_id: 'ticket_report' },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'announcement_changelog',
    badge: 'Announcement',
    name: 'Network Update & Changelog',
    description: 'Multi-field showcase container with interactive patch links.',
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
            { name: '⚡ Optimizations', value: '• Sub-50ms message rendering\n• Redis distributed caching', inline: false },
          ],
          thumbnail: '',
          image: '',
          footer: { text: 'RNG Systems Engine • Build #8942', icon_url: '' },
          components: [
            {
              type: ComponentType.ACTION_ROW,
              id: 'row_update',
              components: [
                { type: ComponentType.BUTTON, id: 'btn_notes', style: 5, label: 'Read Full Patch Notes', emoji: '📖', url: 'https://rng.gg/changelog' },
                { type: ComponentType.BUTTON, id: 'btn_feedback', style: 2, label: 'Report Issues', emoji: '💬', custom_id: 'btn_report_update' },
              ],
            },
          ],
        },
      ],
    },
  },
];

const SAMPLE_COMPONENTS: Array<{
  name: string;
  typeNum: number;
  desc: string;
  comp: DiscordInnerComponent;
}> = [
  {
    name: 'Primary Action Row (5 Buttons)',
    typeNum: 1,
    desc: 'Row with Blurple, Grey, Green, Danger Red, and Link buttons.',
    comp: {
      type: ComponentType.ACTION_ROW,
      id: 'sample_row_action',
      label: 'ACTION CONTROLS',
      components: [
        { type: ComponentType.BUTTON, id: 'btn_1', style: 1, label: 'Primary', custom_id: 'btn_1' },
        { type: ComponentType.BUTTON, id: 'btn_2', style: 2, label: 'Secondary', custom_id: 'btn_2' },
        { type: ComponentType.BUTTON, id: 'btn_3', style: 3, label: 'Success', custom_id: 'btn_3' },
        { type: ComponentType.BUTTON, id: 'btn_4', style: 4, label: 'Danger', custom_id: 'btn_4' },
        { type: ComponentType.BUTTON, id: 'btn_5', style: 5, label: 'Link', url: 'https://discord.com' },
      ],
    },
  },
  {
    name: 'Dynamic String Select Menu',
    typeNum: 3,
    desc: 'Interactive dropdown with custom options and emoji badges.',
    comp: {
      type: ComponentType.STRING_SELECT,
      id: 'sample_sel_menu',
      custom_id: 'menu_interactive',
      placeholder: 'Choose your selection...',
      options: [
        { label: 'Option Alpha', value: 'opt_alpha', emoji: '⭐', description: 'Primary recommendation', default: true },
        { label: 'Option Beta', value: 'opt_beta', emoji: '🔹', description: 'Secondary alternative', default: false },
        { label: 'Option Gamma', value: 'opt_gamma', emoji: '🚀', description: 'High performance tier', default: false },
      ],
    },
  },
  {
    name: 'Section with Thumbnail Accessory',
    typeNum: 9,
    desc: 'Section layout pairing markdown content with thumbnail media.',
    comp: {
      type: ComponentType.SECTION,
      id: 'sample_sec_card',
      text: '### Featured Network Perks\nUnlock exclusive commands, custom roles, and priority server access.',
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          content: '### Featured Network Perks\nUnlock exclusive commands, custom roles, and priority server access.',
        },
      ],
      accessory: {
        type: ComponentType.THUMBNAIL,
        url: 'https://cdn.discordapp.com/embed/avatars/0.png',
        media: { url: 'https://cdn.discordapp.com/embed/avatars/0.png' },
      },
    },
  },
  {
    name: 'Divider Separator (Large Spacing)',
    typeNum: 14,
    desc: 'Horizontal visual divider line with clean spacing.',
    comp: {
      type: ComponentType.SEPARATOR,
      id: 'sample_sep_divider',
      divider: true,
      spacing: 2,
    },
  },
  {
    name: 'Markdown Text Display',
    typeNum: 10,
    desc: 'Discord Components V2 content card supporting rich markdown syntax.',
    comp: {
      type: ComponentType.TEXT_DISPLAY,
      id: 'sample_txt_content',
      content: '### 🛡️ Autonomous Discord Protection\n> Real-time anti-nuke and moderation controls enabled.\n*Powered by RNG Control Center.*',
    },
  },
];

export const LoadPresetModal: React.FC<LoadPresetModalProps> = ({
  isOpen,
  onClose,
  savedTemplates,
  onLoadTemplate,
  onInsertComponent,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved' | 'components'>('presets');
  const [search, setSearch] = useState('');

  const filteredPresets = useMemo(() => {
    const q = search.toLowerCase();
    return BUILTIN_PRESETS.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredSaved = useMemo(() => {
    const q = search.toLowerCase();
    return savedTemplates.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [search, savedTemplates]);

  const filteredComponents = useMemo(() => {
    const q = search.toLowerCase();
    return SAMPLE_COMPONENTS.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Template, Preset, or Component"
      description="Load pre-built official templates, saved cloud drafts, or individual component blueprints into your canvas."
      size="xl"
    >
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Subnavigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-brand-red/15 text-white border border-brand-red/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'presets' ? 'text-brand-red' : 'text-zinc-500'} />
            <span>Built-in RNG Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-brand-red/15 text-white border border-brand-red/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <FolderOpen size={14} className={activeTab === 'saved' ? 'text-brand-red' : 'text-zinc-500'} />
            <span>Saved Database Templates</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {savedTemplates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'components'
                ? 'bg-brand-red/15 text-white border border-brand-red/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Box size={14} className={activeTab === 'components' ? 'text-brand-red' : 'text-zinc-500'} />
            <span>Sample Components</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {SAMPLE_COMPONENTS.length}
            </span>
          </button>
        </div>

        <TextInput
          placeholder="Search templates, presets, and components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 rounded-apple-xl bg-surface-card border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 shadow-apple-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{preset.name}</span>
                    <Badge variant="info" size="sm">
                      {preset.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-3">{preset.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {preset.state.type17Containers.length} container(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTemplate(preset.state, preset.name);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-apple-md bg-brand-red hover:bg-brand-red-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Load into Canvas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Saved Database Templates */}
        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSaved.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                <FolderOpen size={24} className="text-zinc-600" />
                <span>No saved templates matching your search.</span>
              </div>
            ) : (
              filteredSaved.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-apple-xl bg-surface-card border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 shadow-apple-card"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{tpl.name}</span>
                      <Badge variant="neutral" size="sm">
                        {tpl.category || 'General'}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{tpl.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] font-mono text-zinc-500">
                      v{tpl.version} • {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const p = (tpl.payload || tpl.payloadJson || {}) as Record<string, unknown>;
                        let containers: Type17Container[] = [];
                        let content = '';

                        if (Array.isArray(p.containers)) {
                          containers = p.containers as Type17Container[];
                          content = String(p.content || p.builderContent || '');
                        } else if (Array.isArray(p.components)) {
                          try {
                            const parsed = parseDiscordPayloadToState(p);
                            containers = parsed.type17Containers || [];
                            content = parsed.message?.content || '';
                          } catch {
                            containers = [];
                          }
                        }

                        onLoadTemplate(
                          {
                            message: { content },
                            type17Containers: containers,
                          },
                          tpl.name
                        );
                        onClose();
                      }}
                      className="px-3 py-1 rounded-apple-md bg-brand-red hover:bg-brand-red-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Load into Canvas
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Sample Components */}
        {activeTab === 'components' && (
          <div className="flex flex-col gap-2.5">
            {filteredComponents.map((item, idx) => (
              <div
                key={`comp_sample_${idx}`}
                className="p-3.5 rounded-apple-xl bg-surface-card border border-white/10 flex items-center justify-between gap-3 shadow-apple-card"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <Badge variant="info" size="sm">
                      Type {item.typeNum}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400">{item.desc}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus size={13} />}
                  onClick={() => {
                    const cloned = JSON.parse(JSON.stringify(item.comp)) as DiscordInnerComponent;
                    cloned.id = `${item.comp.id || 'comp'}_${Date.now()}`;
                    if (onInsertComponent) {
                      onInsertComponent(cloned);
                    }
                    onClose();
                  }}
                >
                  Insert Component
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
