"use client";

import React, { useState, useEffect } from 'react';
import {
  EmbedAction,
  ActionType,
  RoleSubtype,
  CreateActionPayload,
  ResponseType,
  CompoundOperation
} from './types';
import { api, ServerItem, TemplateData } from '@/lib/api';
import { GlassmorphicDropdown, DropdownOption } from '@/components/ui/GlassmorphicDropdown';
import {
  X,
  Shield,
  Ticket,
  MessageSquare,
  Mail,
  Check,
  AlertCircle,
  HelpCircle,
  Globe,
  Server as ServerIcon,
  Layers
} from 'lucide-react';

interface ActionTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saved: EmbedAction) => void;
  initialAction?: EmbedAction | null;
  serverId?: string;
}

export function ActionTemplateModal(props: ActionTemplateModalProps) {
  if (!props.isOpen) return null;

  return (
    <ActionTemplateModalInner
      key={props.initialAction?.actionId || (props.serverId ? `new-${props.serverId}` : 'new-global')}
      {...props}
    />
  );
}

function ActionTemplateModalInner({
  isOpen,
  onClose,
  onSave,
  initialAction,
  serverId
}: ActionTemplateModalProps) {
  const [name, setName] = useState(initialAction?.name || '');
  const [description, setDescription] = useState(initialAction?.description || '');
  const [isGlobal, setIsGlobal] = useState(initialAction ? Boolean(initialAction.isGlobal) : !serverId);
  const [actionType, setActionType] = useState<ActionType>(initialAction?.actionType || 'ROLE');

  // Multi-server assignment
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>(() => {
    if (initialAction?.serverIds && initialAction.serverIds.length > 0) {
      return initialAction.serverIds;
    }
    if (initialAction?.serverId) {
      return [initialAction.serverId];
    }
    if (serverId) {
      return [serverId];
    }
    return [];
  });
  const [connectedServers, setConnectedServers] = useState<ServerItem[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);

  // Role specific
  const [roleSubtype, setRoleSubtype] = useState<RoleSubtype>(initialAction?.roleSubtype || 'TOGGLE');

  // Ticket specific
  const [channelPrefix, setChannelPrefix] = useState(initialAction?.channelPrefix || 'ticket-');
  const [welcomeMessage, setWelcomeMessage] = useState(initialAction?.welcomeMessage || 'Welcome {user} to support!');

  // Reply / DM specific
  const [replyMode, setReplyMode] = useState<'TEXT' | 'EMBED'>(() => {
    if (initialAction?.actionType === 'REPLY' && initialAction?.responseEmbedTemplateId) {
      return 'EMBED';
    }
    return 'TEXT';
  });
  const [dmMode, setDmMode] = useState<'TEXT' | 'EMBED'>(() => {
    if (initialAction?.actionType === 'DM' && initialAction?.responseEmbedTemplateId) {
      return 'EMBED';
    }
    return 'TEXT';
  });
  const [replyContent, setReplyContent] = useState(initialAction?.replyContent || '');
  const [isEphemeral, setIsEphemeral] = useState(initialAction ? initialAction.isEphemeral !== false : true);
  const [dmContent, setDmContent] = useState(initialAction?.dmContent || '');

  // Response configuration & follow-up template binding
  const [responseType, setResponseType] = useState<ResponseType>(initialAction?.responseType || 'PUBLIC_EMBED');
  const [responseEmbedTemplateId, setResponseEmbedTemplateId] = useState(initialAction?.responseEmbedTemplateId || '');
  const [confirmationMessage, setConfirmationMessage] = useState(initialAction?.confirmationMessage || '');
  const [availableTemplates, setAvailableTemplates] = useState<Array<{
    id: string;
    templateId?: string;
    name: string;
    description?: string;
    isPublic?: boolean;
    category?: string;
  }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Multi-select session dependencies
  const [requiredUser, setRequiredUser] = useState(Boolean(initialAction?.requiredUser));
  const [requiredRole, setRequiredRole] = useState(Boolean(initialAction?.requiredRole));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load connected servers and available embed templates on mount
  useEffect(() => {
    let isMounted = true;

    const fetchConnectedServers = async () => {
      setLoadingServers(true);
      try {
        const res = await api.fetchServers();
        if (isMounted && res.success && res.data) {
          setConnectedServers(res.data);
        }
      } catch (err) {
        console.warn('Could not load servers for ActionTemplateModal:', err);
      } finally {
        if (isMounted) setLoadingServers(false);
      }
    };

    const fetchTemplatesList = async () => {
      setLoadingTemplates(true);
      try {
        const effectiveServerId = serverId || (selectedServerIds[0] ?? undefined);
        const [serverRes, publicRes] = await Promise.all([
          effectiveServerId ? api.fetchTemplates({ serverId: effectiveServerId, size: 100 }) : api.fetchTemplates({ size: 100 }),
          api.fetchTemplates({ size: 100 })
        ]);

        type TemplateItemShape = {
          id: string;
          templateId?: string;
          name: string;
          description?: string;
          isPublic?: boolean;
          category?: string;
        };

        const parseList = (res: any): TemplateItemShape[] => {
          if (!res || !res.data) return [];
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.content) ? res.data.content : []);
          return list.map((item: any) => ({
            id: String(item.id || item.templateId),
            templateId: item.templateId ? String(item.templateId) : String(item.id),
            name: String(item.name || 'Untitled Template'),
            description: item.description ? String(item.description) : undefined,
            isPublic: Boolean(item.isPublic ?? item.public),
            category: item.category ? String(item.category) : undefined
          }));
        };

        const serverItems = parseList(serverRes);
        const publicItems = parseList(publicRes);

        // Strictly MongoDB - deduplicate server and public templates by both templateId and mongo id
        const seenKeys = new Set<string>();
        const uniqueTemplates: TemplateItemShape[] = [];

        [...serverItems, ...publicItems].forEach((tmpl) => {
          const tId = tmpl.templateId?.trim();
          const mId = tmpl.id?.trim();
          const key = tId || mId;
          if (!key) return;

          if (seenKeys.has(key) || (tId && seenKeys.has(tId)) || (mId && seenKeys.has(mId))) {
            return;
          }

          if (tId) seenKeys.add(tId);
          if (mId) seenKeys.add(mId);
          uniqueTemplates.push(tmpl);
        });

        // Purge any stale legacy localStorage template and action keys from user browser
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('rng_discord_user_templates');
            localStorage.removeItem('rng_embed_templates');
            localStorage.removeItem('rng_embed_actions');
          } catch {}
        }

        if (isMounted) {
          setAvailableTemplates(uniqueTemplates);
        }
      } catch (err) {
        console.warn('Could not load templates for ActionTemplateModal:', err);
      } finally {
        if (isMounted) setLoadingTemplates(false);
      }
    };

    fetchConnectedServers();
    fetchTemplatesList();

    return () => {
      isMounted = false;
    };
  }, [isOpen, serverId, selectedServerIds]);

  if (!isOpen) return null;

  const handleServerToggle = (targetId: string) => {
    setSelectedServerIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this action template.');
      return;
    }

    if (!isGlobal && selectedServerIds.length === 0 && !serverId) {
      setError('Please select at least one assigned Discord server or configure as a Global Action.');
      return;
    }

    setSaving(true);
    setError(null);

    const effectiveServerIds = isGlobal
      ? []
      : selectedServerIds.length > 0
        ? selectedServerIds
        : (serverId ? [serverId] : []);

    let effectiveReplyContent: string | undefined = undefined;
    let effectiveDmContent: string | undefined = undefined;
    let effectiveResponseEmbedTemplateId: string | undefined = undefined;
    let effectiveResponseType: ResponseType = responseType;
    let effectiveIsEphemeral: boolean = isEphemeral;

    if (actionType === 'REPLY') {
      if (replyMode === 'TEXT') {
        effectiveReplyContent = replyContent.trim();
        effectiveResponseEmbedTemplateId = undefined;
        effectiveIsEphemeral = isEphemeral;
        effectiveResponseType = isEphemeral ? 'EPHEMERAL_TEXT' : 'PUBLIC_TEXT';
      } else {
        effectiveReplyContent = undefined;
        effectiveResponseEmbedTemplateId = responseEmbedTemplateId.trim() || undefined;
        effectiveIsEphemeral = isEphemeral;
        effectiveResponseType = isEphemeral ? 'EPHEMERAL_EMBED' : 'PUBLIC_EMBED';
      }
    } else if (actionType === 'DM') {
      if (dmMode === 'TEXT') {
        effectiveDmContent = dmContent.trim() || undefined;
        effectiveResponseEmbedTemplateId = undefined;
        effectiveIsEphemeral = false;
        effectiveResponseType = 'DM_EMBED';
      } else {
        effectiveDmContent = undefined;
        effectiveResponseEmbedTemplateId = responseEmbedTemplateId.trim() || undefined;
        effectiveIsEphemeral = false;
        effectiveResponseType = 'DM_EMBED';
      }
    } else if (actionType === 'ROLE') {
      effectiveReplyContent = replyContent.trim() || undefined;
      effectiveResponseEmbedTemplateId = responseEmbedTemplateId.trim() || undefined;
      effectiveResponseType = responseType;
      effectiveIsEphemeral = responseType === 'EPHEMERAL_TEXT' || responseType === 'EPHEMERAL_EMBED' || isEphemeral;
    } else if (actionType === 'TICKET') {
      effectiveDmContent = dmContent.trim() || undefined;
      effectiveResponseEmbedTemplateId = responseEmbedTemplateId.trim() || undefined;
      effectiveResponseType = responseType;
      effectiveIsEphemeral = responseType === 'EPHEMERAL_TEXT' || responseType === 'EPHEMERAL_EMBED' || isEphemeral;
    }

    const payload: CreateActionPayload = {
      serverId: isGlobal ? undefined : (effectiveServerIds[0] || serverId),
      serverIds: effectiveServerIds,
      isGlobal,
      name: name.trim(),
      description: description.trim() || undefined,
      actionType,
      roleSubtype: actionType === 'ROLE' ? roleSubtype : undefined,
      // Dynamic role resolution eliminates hardcoded roleId and roleName
      roleId: undefined,
      roleName: undefined,
      channelPrefix: actionType === 'TICKET' ? channelPrefix.trim() : undefined,
      welcomeMessage: actionType === 'TICKET' ? welcomeMessage.trim() : undefined,
      replyContent: effectiveReplyContent,
      isEphemeral: effectiveIsEphemeral,
      dmContent: effectiveDmContent,
      requiredUser: actionType === 'ROLE' ? true : requiredUser,
      requiredRole: actionType === 'ROLE' ? true : requiredRole,
      responseType: effectiveResponseType,
      responseEmbedTemplateId: effectiveResponseEmbedTemplateId,
      confirmationMessage: confirmationMessage.trim() || undefined,
      compoundOperations: initialAction?.compoundOperations
    };

    try {
      let savedAction: EmbedAction;
      if (initialAction?.actionId) {
        const res = await api.updateActionTemplate(initialAction.actionId, payload);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to update action template.');
        }
        savedAction = res.data;
      } else {
        const res = isGlobal
          ? await api.createActionTemplate(payload)
          : await api.createActionTemplate(payload, effectiveServerIds[0] || serverId);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to create action template.');
        }
        savedAction = res.data;
      }

      onSave(savedAction);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving the action template.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const responseTypeOptions: DropdownOption[] = [
    { value: 'PUBLIC_EMBED', label: 'Public Embed (Components V2)' },
    { value: 'EPHEMERAL_EMBED', label: 'Ephemeral Embed' },
    { value: 'DM_EMBED', label: 'Direct Message Embed' }
  ];

  const templateOptions: DropdownOption[] = React.useMemo(() => {
    const options: DropdownOption[] = [
      { value: '', label: 'None (Default Confirmation)' }
    ];
    const seenValues = new Set<string>(['']);

    availableTemplates.forEach((t) => {
      const val = (t.templateId || t.id || '').trim();
      if (!val || seenValues.has(val)) return;
      seenValues.add(val);

      const isDuplicateName = availableTemplates.filter(
        (x) => x.name.toLowerCase() === t.name.toLowerCase() && (x.templateId || x.id) !== val
      ).length > 0;
      const displayLabel = isDuplicateName ? `${t.name} [${val}]` : (t.name || 'Unnamed Template');

      options.push({
        value: val,
        label: displayLabel,
        description: t.description || (t.category ? `Category: ${t.category}` : undefined) || `ID: ${val}`
      });
    });

    return options;
  }, [availableTemplates]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#111215] border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {initialAction ? 'Edit Action Template' : 'Create Action Template'}
              </h2>
              <p className="text-xs text-zinc-400">
                Configure deterministic Discord button & select interaction workflows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dynamic Role Grant Pipeline, VIP Support Ticket"
                maxLength={100}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this interactive action does"
                rows={2}
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Scope Selection & Server Multi-Select */}
            <div className="space-y-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" /> Action Template Scope
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGlobal(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !isGlobal
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <ServerIcon className="w-3.5 h-3.5" />
                    Server-Specific
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGlobal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isGlobal
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Global Action
                  </button>
                </div>
              </div>

              {!isGlobal && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-300 font-medium">
                      Assigned Discord Servers *
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      {selectedServerIds.length} selected
                    </span>
                  </div>
                  {connectedServers.length > 0 ? (
                    <GlassmorphicDropdown
                      options={connectedServers.map((s) => ({
                        value: s.id,
                        label: s.name,
                        description: `Server ID: ${s.id}`,
                        badge: selectedServerIds.includes(s.id) ? 'Selected' : undefined
                      }))}
                      value={selectedServerIds[0] || ''}
                      onChange={handleServerToggle}
                      placeholder="Select Discord servers..."
                      searchable
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedServerIds.join(', ')}
                      onChange={(e) =>
                        setSelectedServerIds(
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="Comma-separated Discord Server IDs (e.g. 112233445566778899)"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                    />
                  )}
                  {loadingServers && (
                    <p className="text-[11px] text-zinc-500">Loading connected Discord servers...</p>
                  )}
                  {selectedServerIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedServerIds.map((id) => {
                        const matched = connectedServers.find((s) => s.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px]"
                          >
                            <span>{matched ? matched.name : id}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedServerIds((prev) => prev.filter((x) => x !== id))}
                              className="text-red-400 hover:text-red-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Action Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActionType('ROLE')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  actionType === 'ROLE'
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 shadow-md'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-xs font-bold">Role Grant</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('TICKET')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  actionType === 'TICKET'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Ticket className="w-5 h-5" />
                <span className="text-xs font-bold">Private Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('REPLY')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  actionType === 'REPLY'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-md'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-bold">Bot Reply</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('DM')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  actionType === 'DM'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-md'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs font-bold">Direct Message</span>
              </button>
            </div>
          </div>

          {/* Type-Specific Fields */}
          {actionType === 'ROLE' && (
            <div className="p-4 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20 space-y-4">

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Role Operation Subtype</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TOGGLE', 'ADD', 'REMOVE'] as RoleSubtype[]).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setRoleSubtype(sub)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        roleSubtype === sub
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Feedback Content</label>
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="e.g. Role {targetRole} has been updated for {targetUser}!"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Variables supported: {`{targetUser}`}, {`{user}`}, {`{targetRole}`}, {`{server}`}, {`{channel}`}.
                </p>
              </div>
            </div>
          )}

          {actionType === 'TICKET' && (
            <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-4">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Support Ticket Creation
              </h3>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Ticket Channel Name / Pattern</label>
                <input
                  type="text"
                  value={channelPrefix}
                  onChange={(e) => setChannelPrefix(e.target.value)}
                  placeholder="e.g. ticket-0017 or ticket-{hexCode}"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Custom exact name (e.g. <code className="text-zinc-300">ticket-0017</code>) or dynamic pattern using <code className="text-zinc-300">{`{hexCode}`}</code> or <code className="text-zinc-300">{`{username}`}</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Welcome Message in Ticket</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Welcome {user}! Support staff will be with you shortly regarding role {targetRole}."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs resize-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Variables supported: {`{user}`}, {`{username}`}, {`{targetUser}`}, {`{targetRole}`}, {`{server}`}, {`{channel}`}
                </p>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Direct Message Notification / Audit Log (Optional)</label>
                <textarea
                  value={dmContent}
                  onChange={(e) => setDmContent(e.target.value)}
                  placeholder="e.g. A support ticket has been opened for {targetUser} regarding role {targetRole}."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs resize-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Variables supported: {`{user}`}, {`{targetUser}`}, {`{targetRole}`}, {`{server}`}, {`{channel}`}. <br/>
                  <span className="text-[9px] text-zinc-500">
                    Delivered to the operator via DM. Note: When a Follow-Up Embed Template with Direct Message Embed is configured below, the rich log embed is delivered directly and this plain message is skipped.
                  </span>
                </p>
              </div>
            </div>
          )}

          {actionType === 'REPLY' && (
            <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 space-y-4">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Bot Reply Configuration
              </h3>

              {/* Segmented Mode Navigation */}
              <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setReplyMode('TEXT')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    replyMode === 'TEXT'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Text Message
                </button>
                <button
                  type="button"
                  onClick={() => setReplyMode('EMBED')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    replyMode === 'EMBED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Embedded Message
                </button>
              </div>

              {replyMode === 'TEXT' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">Message Content</label>
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Variables supported {`{user}`}, {`{server}`}, {`{channel}`}
                    </p>
                  </div>

                  {/* Minimal Toggle Switch */}
                  <label className="flex items-center justify-between cursor-pointer group py-1 select-none">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                      Is this message ephemeral?
                    </span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={isEphemeral}
                        onChange={(e) => setIsEphemeral(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:border-amber-400" />
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">Embed Template</label>
                    <GlassmorphicDropdown
                      options={templateOptions.filter((t) => t.value !== '')}
                      value={responseEmbedTemplateId}
                      onChange={(val) => setResponseEmbedTemplateId(val)}
                      placeholder="Select embed template..."
                      searchable
                    />
                    {loadingTemplates && (
                      <p className="text-[11px] text-zinc-500 mt-1">Fetching embed templates...</p>
                    )}
                  </div>

                  {/* Minimal Toggle Switch */}
                  <label className="flex items-center justify-between cursor-pointer group py-1 select-none">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                      Is this message ephemeral?
                    </span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={isEphemeral}
                        onChange={(e) => setIsEphemeral(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:border-amber-400" />
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {actionType === 'DM' && (
            <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-4">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" /> Direct Message Configuration
              </h3>

              {/* Segmented Mode Navigation */}
              <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setDmMode('TEXT')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    dmMode === 'TEXT'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Text Message
                </button>
                <button
                  type="button"
                  onClick={() => setDmMode('EMBED')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    dmMode === 'EMBED'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Embedded Message
                </button>
              </div>

              {dmMode === 'TEXT' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">Direct Message Content</label>
                    <input
                      type="text"
                      value={dmContent}
                      onChange={(e) => setDmContent(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Variables supported {`{user}`}, {`{server}`}, {`{channel}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">Embed Template</label>
                    <GlassmorphicDropdown
                      options={templateOptions.filter((t) => t.value !== '')}
                      value={responseEmbedTemplateId}
                      onChange={(val) => setResponseEmbedTemplateId(val)}
                      placeholder="Select embed template..."
                      searchable
                    />
                    {loadingTemplates && (
                      <p className="text-[11px] text-zinc-500 mt-1">Fetching embed templates...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response Configuration Section (Only for ROLE and TICKET workflows) */}
          {(actionType === 'ROLE' || actionType === 'TICKET') && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400" /> Response & Follow-Up Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1.5">Response Type</label>
                  <GlassmorphicDropdown
                    options={responseTypeOptions}
                    value={responseType}
                    onChange={(val) => setResponseType(val as ResponseType)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1.5">Follow-Up Embed Template</label>
                  <GlassmorphicDropdown
                    options={templateOptions}
                    value={responseEmbedTemplateId}
                    onChange={(val) => setResponseEmbedTemplateId(val)}
                    placeholder="Select follow-up embed..."
                    searchable
                  />
                  {loadingTemplates && (
                    <p className="text-[11px] text-zinc-500 mt-1">Fetching embed templates...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialAction ? 'Save Changes' : 'Create Template'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
