"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  EmbedAction,
  ActionType,
  InteractionLogItem
} from './types';
import { api } from '@/lib/api';
import { ActionTemplateModal } from './ActionTemplateModal';
import {
  Search,
  Plus,
  RefreshCw,
  Shield,
  Ticket,
  MessageSquare,
  Mail,
  Copy,
  Check,
  Edit2,
  Trash2,
  Layers,
  Activity,
  Globe,
  Server as ServerIcon,
  AlertCircle
} from 'lucide-react';

interface ActionTemplatesTabProps {
  serverId?: string;
  onSelectAction?: (action: EmbedAction) => void;
}

export function ActionTemplatesTab({
  serverId,
  onSelectAction
}: ActionTemplatesTabProps) {
  const [actions, setActions] = useState<EmbedAction[]>([]);
  const [logs, setLogs] = useState<InteractionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ActionType>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SERVER' | 'GLOBAL'>('ALL');
  const [activeView, setActiveView] = useState<'templates' | 'logs'>('templates');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<EmbedAction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (serverId) {
        res = await api.fetchServerActions(serverId);
      } else {
        res = await api.fetchActionTemplates();
      }

      let loaded: EmbedAction[] = [];
      if (res.success && res.data) {
        loaded = res.data;
      }
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('rng_embed_actions');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const map = new Map<string, EmbedAction>();
              [...loaded, ...parsed].forEach((a: EmbedAction) => {
                if (a.actionId) map.set(a.actionId, a);
              });
              loaded = Array.from(map.values());
            }
          }
        } catch {}
      }

      const filtered = serverId
        ? loaded.filter((a) => a.isGlobal || a.serverId === serverId || (a.serverIds && a.serverIds.includes(serverId)))
        : loaded;
      setActions(filtered);
    } catch (err: unknown) {
      console.warn('Failed to load action templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch action templates');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await api.fetchInteractionLogs({
        serverIdOrSlug: serverId,
        guildId: serverId,
        page: 0,
        size: 30
      });
      if (res.success && res.data && res.data.content) {
        setLogs(res.data.content);
      }
    } catch (err) {
      console.warn('Failed to load interaction logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [serverId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const [actionsRes, logsRes] = await Promise.all([
          serverId ? api.fetchServerActions(serverId) : api.fetchActionTemplates(),
          api.fetchInteractionLogs({
            serverIdOrSlug: serverId,
            guildId: serverId,
            page: 0,
            size: 30
          })
        ]);
        if (!isMounted) return;
        let loaded: EmbedAction[] = [];
        if (actionsRes.success && actionsRes.data) {
          loaded = actionsRes.data;
        }
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('rng_embed_actions');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                const map = new Map<string, EmbedAction>();
                [...loaded, ...parsed].forEach((a: EmbedAction) => {
                  if (a.actionId) map.set(a.actionId, a);
                });
                loaded = Array.from(map.values());
              }
            }
          } catch {}
        }
        const filtered = serverId
          ? loaded.filter((a) => a.isGlobal || a.serverId === serverId || (a.serverIds && a.serverIds.includes(serverId)))
          : loaded;
        setActions(filtered);
        if (logsRes.success && logsRes.data && logsRes.data.content) {
          setLogs(logsRes.data.content);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.warn('Failed to load initial action data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch action templates');
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingLogs(false);
        }
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const handleCopyActionId = (actionId: string) => {
    navigator.clipboard.writeText(actionId);
    setCopiedId(actionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteAction = async (actionId: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to delete action template "${name}"?`);
    if (!confirm) return;

    try {
      await api.deleteActionTemplate(actionId);
      setActions((prev) => prev.filter((a) => a.actionId !== actionId));
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('rng_embed_actions');
          if (stored) {
            const parsed: EmbedAction[] = JSON.parse(stored);
            const filtered = parsed.filter((a) => a.actionId !== actionId);
            localStorage.setItem('rng_embed_actions', JSON.stringify(filtered));
          }
        } catch {}
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete action template');
    }
  };

  const handleDuplicateAction = (action: EmbedAction) => {
    const duplicate: EmbedAction = {
      ...action,
      id: undefined,
      actionId: '',
      name: `${action.name} (Copy)`
    };
    setEditingAction(duplicate);
    setIsModalOpen(true);
  };

  const handleSavedAction = (saved: EmbedAction) => {
    setActions((prev) => {
      const idx = prev.findIndex((a) => a.actionId === saved.actionId);
      let next: EmbedAction[];
      if (idx !== -1) {
        next = [...prev];
        next[idx] = saved;
      } else {
        next = [saved, ...prev];
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rng_embed_actions', JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Filter actions
  const filteredActions = actions.filter((action) => {
    if (typeFilter !== 'ALL' && action.actionType !== typeFilter) return false;
    if (scopeFilter === 'SERVER' && action.isGlobal) return false;
    if (scopeFilter === 'GLOBAL' && !action.isGlobal) return false;
    if (serverId) {
      const isScoped = action.isGlobal || action.serverId === serverId || (action.serverIds && action.serverIds.includes(serverId));
      if (!isScoped) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = action.name?.toLowerCase().includes(q);
      const matchDesc = action.description?.toLowerCase().includes(q);
      const matchRole = action.roleName?.toLowerCase().includes(q);
      const matchId = action.actionId?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchRole && !matchId) return false;
    }
    return true;
  });

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'ROLE':
        return <Shield className="w-4 h-4 text-indigo-400" />;
      case 'TICKET':
        return <Ticket className="w-4 h-4 text-emerald-400" />;
      case 'REPLY':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'DM':
        return <Mail className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getActionBadgeColor = (type: ActionType) => {
    switch (type) {
      case 'ROLE':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'TICKET':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'REPLY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DM':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0c0e] text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/10 bg-white/[0.01]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-red-500">⚡</span> Interactive Action Engine
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
              Gateway V2
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Build, register, and reuse action workflows bound to Discord buttons and select menus
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveView('templates')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'templates'
                  ? 'bg-white/10 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Templates ({actions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('logs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'logs'
                  ? 'bg-white/10 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Audit Logs ({logs.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingAction(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Action</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'templates' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action templates by name, role, ID..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'ROLE', 'TICKET', 'REPLY', 'DM'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === t
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                      : 'bg-black/30 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t}
                </button>
              ))}

              <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

              {/* Scope Filters */}
              {(['ALL', 'SERVER', 'GLOBAL'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScopeFilter(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scopeFilter === s
                      ? 'bg-white/15 text-white border border-white/30'
                      : 'bg-black/30 text-zinc-500 hover:text-zinc-300 border border-white/5'
                  }`}
                >
                  {s === 'ALL' ? 'All Scopes' : s === 'SERVER' ? 'Server' : 'Global'}
                </button>
              ))}

              <button
                type="button"
                onClick={loadActions}
                disabled={loading}
                title="Refresh Templates"
                className="p-2 rounded-lg bg-black/30 border border-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-zinc-500 text-xs gap-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
              <span>Loading action templates...</span>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-white/[0.01] border border-white/5 p-8">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 mb-3">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No Action Templates Found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'No action templates match your current search and filter criteria.'
                  : 'Get started by creating an Action Template to connect buttons and select menus to deterministic Discord workflows.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingAction(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Action</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActions.map((action) => (
                <div
                  key={action.actionId}
                  className="group relative flex flex-col justify-between rounded-2xl bg-[#141519] border border-white/10 hover:border-red-500/40 hover:shadow-xl hover:shadow-black/50 transition-all duration-200 p-5 overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top Row: Type Badge + Scope Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getActionBadgeColor(action.actionType)}`}>
                          {getActionIcon(action.actionType)}
                          <span>{action.actionType}</span>
                          {action.roleSubtype && (
                            <span className="text-[10px] opacity-75 font-mono">({action.roleSubtype})</span>
                          )}
                        </span>
                        {action.isGlobal ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Globe className="w-3 h-3" /> Global
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-500/10 border border-zinc-500/20 text-zinc-400">
                            <ServerIcon className="w-3 h-3" /> {action.serverIds && action.serverIds.length > 1 ? `${action.serverIds.length} Servers` : 'Server'}
                          </span>
                        )}
                        {action.responseType && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/10 text-zinc-300">
                            {action.responseType}
                          </span>
                        )}
                      </div>

                      {/* Action ID Copy Chip */}
                      <button
                        type="button"
                        onClick={() => handleCopyActionId(action.actionId)}
                        title="Copy Action ID to clipboard"
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 border border-white/10 text-[10.5px] font-mono text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                      >
                        {copiedId === action.actionId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{action.actionId.substring(0, 14)}...</span>
                      </button>
                    </div>

                    {/* Name & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                        {action.name}
                      </h3>
                      {action.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                          {action.description}
                        </p>
                      )}
                    </div>

                    {/* Details Pill */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs">
                      {action.actionType === 'ROLE' && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-500 text-[11px]">Target Role:</span>
                          <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {action.roleName || action.roleId || 'Unknown Role'}
                          </span>
                        </div>
                      )}

                      {action.actionType === 'TICKET' && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-500 text-[11px]">Prefix:</span>
                          <span className="font-mono text-emerald-300 text-[11px]">
                            {action.channelPrefix || 'ticket-'}
                          </span>
                        </div>
                      )}

                      {action.actionType === 'REPLY' && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-500 text-[11px]">Visibility:</span>
                          <span className="text-amber-300 text-[11px] font-semibold">
                            {action.isEphemeral ? 'Ephemeral' : 'Public'}
                          </span>
                        </div>
                      )}

                      {/* Multi-Select Flags */}
                      {(action.requiredUser || action.requiredRole) && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-zinc-500">Requires:</span>
                          {action.requiredUser && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                              User Select
                            </span>
                          )}
                          {action.requiredRole && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              Role Select
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAction(action);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit Action Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateAction(action)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAction(action.actionId, action.name)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {onSelectAction && (
                      <button
                        type="button"
                        onClick={() => onSelectAction(action)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        Use Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Interaction Logs View */
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Interaction Telemetry & Audit Logs
              </h2>
              <p className="text-xs text-zinc-400">
                Live immutable execution records retained with 90-day automated TTL expiration
              </p>
            </div>
            <button
              type="button"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-20 text-zinc-500 text-xs gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
              <span>Loading telemetry logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-white/[0.01] border border-white/5">
              <Activity className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No interaction logs recorded yet.</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Logs appear automatically when community members interact with action buttons in Discord.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#121316] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Execution Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                        {log.actionId}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-200 whitespace-nowrap">
                        {log.username || log.userId}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : log.status === 'RATE_LIMITED'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 max-w-md truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Creation / Edit Modal */}
      <ActionTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAction(null);
        }}
        onSave={handleSavedAction}
        initialAction={editingAction}
        serverId={serverId}
      />
    </div>
  );
}
