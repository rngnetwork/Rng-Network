'use client';

import React, { useState } from 'react';
import { ChevronDown, Shield, RefreshCw } from 'lucide-react';
import type { BotModuleFieldSchema } from '@/lib/model/bot-module';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { ModuleInheritanceIndicator } from '@/components/common/input/ModuleInheritanceIndicator';
import { Modal } from '@/components/common/feedback/Modal';
import { Button } from '@/components/common/input/Button';
import { ModuleAstRenderer } from './ModuleAstRenderer';
import type { DiscordRoleOption } from '@/components/common/input/DiscordRoleSelect';
import type { DiscordChannelOption } from '@/components/common/input/DiscordChannelSelect';

export interface ModuleCardProps {
  moduleName: string;
  schema: Record<string, BotModuleFieldSchema>;
  values: Record<string, unknown>;
  onChange: (moduleName: string, fieldName: string, value: unknown) => void;
  isOverridden?: boolean;
  isNetworkDeck?: boolean;
  onOverride?: (moduleName: string) => void;
  onRevert?: (moduleName: string) => Promise<void> | void;
  serverRoles?: DiscordRoleOption[];
  serverChannels?: DiscordChannelOption[];
  defaultExpanded?: boolean;
  highlightMatch?: boolean;
  className?: string;
}

const MODULE_TITLES: Record<string, string> = {
  automod: 'Automated Moderation',
  antinuke: 'Anti-Nuke Protection',
  ticket: 'Support Ticket System',
  leveling: 'Leveling & Experience',
  economy: 'Economy & Commerce',
  giveaway: 'Giveaway Dispatcher',
  logging: 'Audit Logging Pipeline',
  verification: 'Gatekeeper Verification',
  reactionrole: 'Reaction Role Engine',
  welcome: 'Welcome & Onboarding',
  music: 'High-Fidelity Audio',
  customcommands: 'Custom Commands Engine',
  invitetracker: 'Invite Tracking Analytics',
  starboard: 'Community Starboard',
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleName,
  schema = {},
  values = {},
  onChange,
  isOverridden = true,
  isNetworkDeck = false,
  onOverride,
  onRevert,
  serverRoles = [],
  serverChannels = [],
  defaultExpanded = false,
  highlightMatch = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const humanTitle = MODULE_TITLES[moduleName.toLowerCase()] || moduleName;
  const isMasterEnabled = values.enabled !== false;
  const canEdit = isNetworkDeck || isOverridden;

  const handleConfirmRevert = async () => {
    if (!onRevert) return;
    try {
      setIsReverting(true);
      await onRevert(moduleName);
      setShowRevertModal(false);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <>
      <div
        className={`flex flex-col rounded-apple-lg bg-zinc-900/90 border transition-all duration-200 overflow-hidden ${
          highlightMatch
            ? 'border-brand-red/60 shadow-elevated ring-1 ring-brand-red/30'
            : 'border-surface-border hover:border-zinc-700/80'
        } ${className}`}
      >
        <div className="flex items-center justify-between p-4 gap-3 select-none">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <div className="w-8 h-8 rounded-apple-md bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 shrink-0">
              <Shield size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-text-primary tracking-tight truncate">
                {humanTitle}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 truncate">
                {moduleName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isNetworkDeck ? (
              <ModuleInheritanceIndicator isOverridden={isOverridden} />
            ) : null}

            <ToggleSwitch
              checked={isMasterEnabled}
              disabled={!canEdit}
              onChange={(checked) => onChange(moduleName, 'enabled', checked)}
              size="sm"
            />

            {!isNetworkDeck && !isOverridden && onOverride ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOverride(moduleName);
                }}
                className="text-[11px] font-medium text-brand-red hover:text-white px-2 py-1 rounded-apple-sm bg-brand-red/10 border border-brand-red/30 transition-colors duration-150 cursor-pointer"
              >
                Override Module
              </button>
            ) : null}

            {!isNetworkDeck && isOverridden && onRevert ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRevertModal(true);
                }}
                title="Revert to network default"
                className="text-zinc-500 hover:text-white p-1 rounded-apple-sm hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
              >
                <RefreshCw size={13} />
              </button>
            ) : null}

            <button
              type="button"
              aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-zinc-400 hover:text-white p-1 rounded-apple-sm transition-colors duration-150 cursor-pointer"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {isExpanded ? (
          <div className="p-4 pt-1 border-t border-border/40 bg-zinc-950/40">
            <ModuleAstRenderer
              moduleName={moduleName}
              schema={schema}
              values={values}
              onChange={onChange}
              isNetworkDeck={isNetworkDeck}
              serverRoles={serverRoles}
              serverChannels={serverChannels}
              disabled={!canEdit}
            />
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={showRevertModal}
        onClose={() => !isReverting && setShowRevertModal(false)}
        title="Revert Module to Default"
        description={`Are you sure you want to revert ${humanTitle} to its network default configuration? Any custom server overrides will be removed.`}
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={isReverting}
              onClick={() => setShowRevertModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isReverting}
              onClick={handleConfirmRevert}
            >
              Confirm Revert
            </Button>
          </div>
        }
      >
        <p className="text-xs text-zinc-400">
          This server will inherit all future network updates made to this module.
        </p>
      </Modal>
    </>
  );
};
