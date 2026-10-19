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
  Pencil,
  ArrowUpRight,
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
import { fetchServers } from '@/lib/api/dashboard/servers';

export interface ActionTemplatesTabProps {
  serverId?: string;
  serversMap?: Record<string, string>;
  onSelectAction?: (action: EmbedAction) => void;
  onActionsUpdated?: () => void;
  embedTemplates?: TemplateData[];
}

export const ActionTemplatesTab: React.FC<ActionTemplatesTabProps> = ({
  serverId,
  serversMap,
  onSelectAction,
  onActionsUpdated,
  embedTemplates = [],
}) => {
  const { toast } = useToast();
  const [actions, setActions] = useState<EmbedAction[]>([]);
  const [internalServersMap, setInternalServersMap] = useState<Record<string, string>>(serversMap || {});
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

  useEffect(() => {
    if (serversMap && Object.keys(serversMap).length > 0) {
      setInternalServersMap(serversMap);
      return;
    }
    fetchServers()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const map: Record<string, string> = {};
          res.data.forEach((srv) => {
            map[srv.id] = srv.name;
          });
          setInternalServersMap(map);
        }
      })
      .catch(() => {});
  }, [serversMap]);

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
                {scope === 'ALL' ? 'All Scopes' : scope === 'GLOBAL' ? 'Global' : 'Server-Specific'}
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
              {type === 'ALL'
                ? 'All Types'
                : type === 'ROLE'
                ? 'Role Grant'
                : type === 'TICKET'
                ? 'Private Ticket'
                : type === 'REPLY'
                ? 'Bot Reply'
                : 'Bot DM'}
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
            const assignedServers: string[] =
              Array.isArray(action.serverIds) && action.serverIds.length > 0
                ? action.serverIds
                : action.serverId
                ? [action.serverId]
                : [];

            const actionTypeLabel =
              action.actionType === 'ROLE'
                ? 'role'
                : action.actionType === 'TICKET'
                ? 'ticket'
                : action.actionType === 'REPLY'
                ? 'reply'
                : 'dm';

            return (
              <div
                key={action.id || action.actionId}
                className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between gap-4 shadow-apple-card"
              >
                <div className="flex flex-col gap-2">
                  {/* Header: Name + Real Action Type Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap size={16} className="text-brand-red shrink-0" />
                      <h4 className="text-sm font-bold text-white truncate">
                        {action.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
                        {actionTypeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Copyable Action ID chip */}
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-apple-md bg-black/40 border border-white/[0.06]">
                    <span className="font-mono text-[11px] text-zinc-400 truncate select-all">
                      {action.actionId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(action.actionId)}
                      title="Copy Action ID"
                      aria-label="Copy Action ID"
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                      {isCopied ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>

                  {/* Description: Only shown if non-empty */}
                  {action.description?.trim() ? (
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {action.description}
                    </p>
                  ) : null}
                </div>

                {/* Footer: Scope Pills on Left + Colored Action Buttons on Right */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  {/* Scope Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {action.isGlobal ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
                        Global
                      </span>
                    ) : assignedServers.length > 0 ? (
                      assignedServers.map((sid) => (
                        <span
                          key={sid}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300"
                        >
                          {internalServersMap[sid] || sid}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
                        Server-Specific
                      </span>
                    )}
                  </div>

                  {/* Colored Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const copyAction: EmbedAction = {
                          ...action,
                          id: undefined,
                          actionId: `rng_act_${Math.random().toString(16).slice(2, 10).padEnd(16, '0').slice(0, 16)}`,
                          name: `${action.name} (Copy)`,
                        };
                        setEditingAction(copyAction);
                      }}
                      title="Duplicate Action Template"
                      aria-label={`Duplicate action template ${action.name}`}
                      className="p-1.5 rounded-apple-md text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingAction(action)}
                      title="Edit Action Template"
                      aria-label={`Edit action template ${action.name}`}
                      className="p-1.5 rounded-apple-md text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAction(action.actionId, action.name)}
                      aria-label={`Delete action template ${action.name}`}
                      title="Delete Action Template"
                      className="p-1.5 rounded-apple-md text-white bg-red-600 hover:bg-red-500 border border-red-400/30 shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>

                    {onSelectAction && (
                      <button
                        type="button"
                        onClick={() => onSelectAction(action)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Select</span>
                        <ArrowUpRight size={13} />
                      </button>
                    )}
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
