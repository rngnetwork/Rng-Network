'use client';

import React, { useState, useMemo } from 'react';
import { FolderOpen, Sparkles, Layers, Shield, FileText } from 'lucide-react';
import { Modal } from '@/components/common/feedback/Modal';
import { Badge } from '@/components/common/feedback/Badge';
import { TextInput } from '@/components/common/input/TextInput';
import type { Type17Container, TemplateData, DiscordInnerComponent } from '@/lib/model/embed';
import { ComponentType } from '@/lib/model/embed';

export interface LoadPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTemplates: TemplateData[];
  onLoadTemplate: (state: { message: { content: string }; type17Containers: Type17Container[] }, name?: string) => void;
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
          title: 'Official Server Guidelines & Verification',
          description: 'By joining our network you agree to maintain community standards.\n\n• Respect all server members and staff.\n• No unsolicited spam or self-promotion.\n• Follow Discord Terms of Service.',
          fields: [
            { name: 'Channel Access', value: 'Complete verification below to receive member privileges.', inline: true },
            { name: 'Ministry Clearance', value: 'Personnel clearance is required for operations channels.', inline: true },
          ],
          components: [
            {
              type: ComponentType.ACTION_ROW,
              id: 'row_gate_btns',
              components: [
                {
                  type: ComponentType.BUTTON,
                  id: 'btn_verify',
                  style: 3,
                  label: 'Verify & Accept Rules',
                  custom_id: 'rng_act_verify_0001',
                },
                {
                  type: ComponentType.BUTTON,
                  id: 'btn_help',
                  style: 2,
                  label: 'Support Desk',
                  custom_id: 'rng_act_ticket_0002',
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'tactical_ops_directive',
    badge: 'Operations',
    name: 'Tactical Operations Directive',
    description: 'Ministry of War deployment briefing with embedded media gallery and danger confirmation button.',
    state: {
      message: { content: '⚠️ **HIGH COMMAND OPERATIONAL BRIEFING** — Priority Alpha Transmission' },
      type17Containers: [
        {
          id: 'c17_ops',
          accentColor: '#E11D2E',
          isSpoiler: false,
          title: 'Directive #4092: Sector Defense Protocol',
          description: 'All field operatives are ordered to report to assigned defensive perimeter checkpoints immediately.',
          fields: [
            { name: 'Operation Codename', value: 'Operation Crimson Shield', inline: true },
            { name: 'Execution Status', value: 'Active Engagement', inline: true },
          ],
          components: [
            {
              type: ComponentType.SEPARATOR,
              id: 'sep_ops',
              divider: true,
              spacing: 1,
            },
            {
              type: ComponentType.ACTION_ROW,
              id: 'row_ops',
              components: [
                {
                  type: ComponentType.BUTTON,
                  id: 'btn_ops_ack',
                  style: 1,
                  label: 'Acknowledge Orders',
                  custom_id: 'rng_act_ack_0003',
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'ticket_support_desk',
    badge: 'Support',
    name: 'Private Text Ticket Desk',
    description: 'Automated support hub provisioning private inquiry text channels with dual overrides.',
    state: {
      message: { content: 'Need assistance from server leadership? Open a confidential support ticket below.' },
      type17Containers: [
        {
          id: 'c17_ticket',
          accentColor: '#00A8FC',
          isSpoiler: false,
          title: 'RNG Community Support Center',
          description: 'Select your inquiry department below to spawn an encrypted support text channel.',
          components: [
            {
              type: ComponentType.ACTION_ROW,
              id: 'row_ticket_sel',
              components: [
                {
                  type: ComponentType.STRING_SELECT,
                  id: 'sel_ticket_dept',
                  custom_id: 'rng_act_ticket_dept',
                  placeholder: 'Select department...',
                  options: [
                    { label: 'General Inquiries', value: 'dept_general', description: 'Assistance with server access' },
                    { label: 'Personnel Reports', value: 'dept_report', description: 'Confidential conduct report' },
                    { label: 'Clearance Appeal', value: 'dept_appeal', description: 'Ministry rank appeal' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

export const LoadPresetModal: React.FC<LoadPresetModalProps> = ({
  isOpen,
  onClose,
  savedTemplates,
  onLoadTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved'>('presets');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Template or Preset"
      size="xl"
    >
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
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
        </div>

        <TextInput
          placeholder="Search templates and presets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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
                    <Badge variant="info" size="sm">{preset.badge}</Badge>
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

        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSaved.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-zinc-400">
                No saved templates matching your search.
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
                      <Badge variant="neutral" size="sm">{tpl.category || 'General'}</Badge>
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
                        const raw = (tpl.payload || tpl.payloadJson || {}) as {
                          content?: string;
                          components?: unknown[];
                        };
                        const loadedContainers: Type17Container[] = [
                          {
                            id: `loaded_${tpl.id}`,
                            accentColor: '#E11D2E',
                            title: tpl.name,
                            description: tpl.description,
                            components: [],
                          },
                        ];
                        onLoadTemplate(
                          {
                            message: { content: raw.content || '' },
                            type17Containers: loadedContainers,
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
      </div>
    </Modal>
  );
};
