'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Plus,
  Trash2,
  FileCode,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import type { EmbedAction, CreateActionPayload } from '@/lib/model/action';
import type { TemplateData } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';
import { ActionTemplateModal } from '@/components/dashboard/embeds/modals/ActionTemplateModal';
import { useToast } from '@/components/common/feedback/ToastProvider';

export interface ServerActionTemplatesTabProps {
  serverId: string;
  actions: EmbedAction[];
  embedTemplates?: TemplateData[];
  loading?: boolean;
  onCreateAction: (payload: CreateActionPayload) => Promise<void> | void;
  onUpdateAction: (actionId: string, payload: CreateActionPayload) => Promise<void> | void;
  onDeleteAction: (actionId: string) => Promise<void> | void;
}

export const ServerActionTemplatesTab: React.FC<
  ServerActionTemplatesTabProps
> = ({
  serverId,
  actions,
  embedTemplates = [],
  loading = false,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
}) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<EmbedAction | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCopyId = async (actionId: string) => {
    try {
      await navigator.clipboard.writeText(actionId);
      setCopiedId(actionId);
      toast({
        type: 'success',
        title: 'Action ID Copied',
        description: `Copied ${actionId} to clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="p-5 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-brand-red" />
            Action Registry Management
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Encode compact 24-char identifiers (`rng_act_&lt;16_hex&gt;`) into button `custom_id` and select option `value` attributes.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Action Template
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400">
          Loading server action templates...
        </div>
      ) : actions.length === 0 ? (
        <div className="p-10 rounded-apple-xl bg-surface-card border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <FileCode size={22} />
          </div>
          <h4 className="text-sm font-bold text-white">
            No Action Templates Registered
          </h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Register interactive templates for roles, tickets, replies, or DMs to bind to buttons without hardcoded message payloads.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create First Action
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {actions.map((act) => (
            <div
              key={act.actionId}
              className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">
                      {act.name}
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                      {act.description || 'No description provided.'}
                    </span>
                  </div>
                  <Badge
                    variant={
                      act.actionType === 'ROLE'
                        ? 'crimson'
                        : act.actionType === 'TICKET'
                        ? 'brand'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {act.actionType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-apple-md bg-black/40 border border-white/[0.06]">
                  <code className="text-xs font-mono font-semibold text-zinc-200 truncate">
                    {act.actionId}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyId(act.actionId)}
                    aria-label={`Copy action id ${act.actionId}`}
                    className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedId === act.actionId ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                {act.actionType === 'DM' && act.dispatchDMLogsWithFallback && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
                    <ShieldAlert size={12} className="shrink-0" />
                    <span>Closed DMs (Error 50007) fallback active</span>
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteAction(act.actionId)}
                  aria-label={`Delete action ${act.name}`}
                  className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingAction(act)}
                >
                  Edit Action
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <ActionTemplateModal
          isOpen={isCreateModalOpen}
          serverId={serverId}
          embedTemplates={embedTemplates}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (payload) => {
            await onCreateAction(payload);
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {editingAction && (
        <ActionTemplateModal
          isOpen={Boolean(editingAction)}
          initialAction={editingAction}
          serverId={serverId}
          embedTemplates={embedTemplates}
          onClose={() => setEditingAction(null)}
          onSubmit={async (payload) => {
            await onUpdateAction(editingAction.actionId, payload);
            setEditingAction(null);
          }}
        />
      )}
    </div>
  );
};
