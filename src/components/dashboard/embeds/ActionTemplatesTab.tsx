'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy,
  Check,
  Plus,
  Trash2,
  FileCode,
  Layers,
  Search,
  Zap,
} from 'lucide-react';
import type { EmbedAction, CreateActionPayload } from '@/lib/model/action';
import type { TemplateData } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';
import { TextInput } from '@/components/common/input/TextInput';
import { ActionTemplateModal } from '@/components/dashboard/embeds/modals/ActionTemplateModal';
import { useToast } from '@/components/common/feedback/ToastProvider';
import {
  fetchActionTemplates,
  createActionTemplate,
  deleteActionTemplate,
  updateActionTemplate,
} from '@/lib/api/dashboard/embeds';

export interface ActionTemplatesTabProps {
  serverId?: string;
  onSelectAction?: (action: EmbedAction) => void;
  onActionsUpdated?: () => void;
  embedTemplates?: TemplateData[];
}

export const ActionTemplatesTab: React.FC<ActionTemplatesTabProps> = ({
  serverId,
  onSelectAction,
  onActionsUpdated,
  embedTemplates = [],
}) => {
  const { toast } = useToast();
  const [actions, setActions] = useState<EmbedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SERVER' | 'GLOBAL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<EmbedAction | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadActions = useCallback(async () => {
    setLoading(true);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await fetchActionTemplates(serverId, token);
      if (res.success && Array.isArray(res.data)) {
        setActions(res.data);
      }
    } catch {
      // Empty list fallback
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

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

  const handleCreateAction = async (payload: CreateActionPayload) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await createActionTemplate(payload, serverId, token);
      if (res.success) {
        toast({
          type: 'success',
          title: 'Action Created',
          description: `Action template ${res.data.actionId} persisted.`,
        });
        setIsCreateModalOpen(false);
        void loadActions();
        onActionsUpdated?.();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Action Creation Failed',
        description: 'Failed to create action template.',
      });
    }
  };

  const handleUpdateAction = async (actionId: string, payload: CreateActionPayload) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await updateActionTemplate(actionId, payload, token);
      if (res.success) {
        toast({
          type: 'success',
          title: 'Action Updated',
          description: `Action template ${actionId} updated.`,
        });
        setEditingAction(null);
        void loadActions();
        onActionsUpdated?.();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update action template.',
      });
    }
  };

  const handleDeleteAction = async (actionId: string, name: string) => {
    const proceed = window.confirm(`Delete action template "${name}" (${actionId})?`);
    if (!proceed) return;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await deleteActionTemplate(actionId, token);
      if (res.success) {
        toast({
          type: 'info',
          title: 'Action Deleted',
          description: `Removed ${actionId} from registry.`,
        });
        void loadActions();
        onActionsUpdated?.();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete action template.',
      });
    }
  };

  const filteredActions = useMemo(() => {
    const q = search.toLowerCase();
    return actions.filter((act) => {
      const matchesType = typeFilter === 'ALL' || act.actionType === typeFilter;
      const matchesScope =
        scopeFilter === 'ALL' ||
        (scopeFilter === 'GLOBAL' ? act.isGlobal : !act.isGlobal);
      const matchesSearch =
        !q ||
        act.name.toLowerCase().includes(q) ||
        act.actionId.toLowerCase().includes(q) ||
        (act.description?.toLowerCase().includes(q) ?? false);
      return matchesType && matchesScope && matchesSearch;
    });
  }, [actions, search, typeFilter, scopeFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="p-5 rounded-apple-xl bg-surface-card border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-apple-card">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-brand-red" />
            Action Templates Registry
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Interactive actions for buttons and select menus.
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

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-apple-xl bg-surface-card border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-apple-card">
        <div className="w-full sm:w-72">
          <TextInput
            placeholder="Search action templates or rng_act_..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} className="text-zinc-400" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Filter */}
          <div className="flex items-center gap-1 p-0.5 rounded-apple-md bg-black/40 border border-white/10 mr-2">
            {(['ALL', 'GLOBAL', 'SERVER'] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setScopeFilter(scope)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  scopeFilter === scope
                    ? 'bg-brand-red text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {scope === 'ALL' ? 'All Scopes' : scope === 'GLOBAL' ? 'Global' : 'Server'}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          {(['ALL', 'ROLE', 'TICKET', 'REPLY', 'DM'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === type
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Action Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400">
          Loading action templates...
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="p-10 rounded-apple-xl bg-surface-card border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300">
            <FileCode size={22} />
          </div>
          <h4 className="text-sm font-bold text-white">No Action Templates Found</h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Register interactive templates for roles, tickets, replies, or DMs to bind to buttons.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create First Action Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action) => {
            const isCopied = copiedId === action.actionId;
            const scopeLabel = action.isGlobal
              ? 'Global'
              : action.serverIds && action.serverIds.length > 0
              ? `${action.serverIds.length} Server${action.serverIds.length !== 1 ? 's' : ''}`
              : 'Server Scoped';

            return (
              <div
                key={action.id || action.actionId}
                className="p-4 rounded-apple-xl bg-surface-card border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 shadow-apple-card"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {action.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {action.actionType === 'ROLE' && (
                        <Badge variant="neutral" size="sm">
                          ROLE · {action.roleSubtype || 'TOGGLE'}
                        </Badge>
                      )}
                      {action.actionType === 'TICKET' && (
                        <Badge variant="neutral" size="sm">
                          TICKET
                        </Badge>
                      )}
                      {action.actionType === 'REPLY' && (
                        <Badge variant="neutral" size="sm">
                          REPLY
                        </Badge>
                      )}
                      {action.actionType === 'DM' && (
                        <Badge variant="crimson" size="sm">
                          DM
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {action.description || 'No description provided.'}
                  </p>

                  {/* 1-Click Copyable Action ID Chip */}
                  <button
                    type="button"
                    onClick={() => handleCopyId(action.actionId)}
                    title="Click to copy action identifier"
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-apple-md bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <span className="text-[11px] truncate text-zinc-300 font-mono">
                      {action.actionId}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 text-zinc-400">
                      {isCopied ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <Badge variant="neutral" size="sm">
                    {scopeLabel}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const copyAction: EmbedAction = {
                          ...action,
                          id: undefined,
                          actionId: `rng_act_${Math.random().toString(16).slice(2, 10).padEnd(16, '0').slice(0, 16)}`,
                          name: `${action.name} (Copy)`,
                        };
                        setEditingAction(copyAction);
                      }}
                      className="min-h-[28px] px-2 py-0.5 text-xs text-zinc-300 hover:text-white"
                      title="Duplicate Action Template"
                    >
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingAction(action)}
                      className="min-h-[28px] px-2.5 py-0.5 text-xs"
                    >
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAction(action.actionId, action.name)}
                      aria-label={`Delete action ${action.name}`}
                      title="Delete Action Template"
                      className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <ActionTemplateModal
          isOpen={isCreateModalOpen}
          serverId={serverId}
          embedTemplates={embedTemplates}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateAction}
        />
      )}

      {/* Edit Modal */}
      {editingAction && (
        <ActionTemplateModal
          isOpen={Boolean(editingAction)}
          serverId={serverId}
          initialAction={editingAction}
          embedTemplates={embedTemplates}
          onClose={() => setEditingAction(null)}
          onSubmit={(payload: CreateActionPayload) => handleUpdateAction(editingAction.actionId, payload)}
        />
      )}
    </div>
  );
};
