"use client";

import React, { useState, useEffect } from 'react';
import {
  EmbedAction,
  ActionType,
  RoleSubtype,
  CreateActionPayload,
  ServerRole
} from './types';
import { api } from '@/lib/api';
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
  Server as ServerIcon
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

  // Role specific
  const [roleSubtype, setRoleSubtype] = useState<RoleSubtype>(initialAction?.roleSubtype || 'TOGGLE');
  const [selectedRoleId, setSelectedRoleId] = useState(initialAction?.roleId || '');
  const [selectedRoleName, setSelectedRoleName] = useState(initialAction?.roleName || '');
  const [serverRoles, setServerRoles] = useState<ServerRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Ticket specific
  const [channelPrefix, setChannelPrefix] = useState(initialAction?.channelPrefix || 'ticket-');
  const [welcomeMessage, setWelcomeMessage] = useState(initialAction?.welcomeMessage || 'Welcome {user} to support!');

  // Reply / DM specific
  const [replyContent, setReplyContent] = useState(initialAction?.replyContent || '');
  const [isEphemeral, setIsEphemeral] = useState(initialAction ? initialAction.isEphemeral !== false : true);
  const [dmContent, setDmContent] = useState(initialAction?.dmContent || '');

  // Chaining flags
  const [requiredUser, setRequiredUser] = useState(Boolean(initialAction?.requiredUser));
  const [requiredRole, setRequiredRole] = useState(Boolean(initialAction?.requiredRole));
  const [responseEmbedTemplateId, setResponseEmbedTemplateId] = useState(initialAction?.responseEmbedTemplateId || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load server roles when modal opens and serverId exists
  useEffect(() => {
    if (!serverId) return;
    let isMounted = true;
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const res = await api.fetchServerRoles(serverId);
        if (isMounted && res.success && res.data) {
          setServerRoles(res.data);
        }
      } catch (err) {
        console.warn('Could not load guild roles for ActionTemplateModal:', err);
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    };
    fetchRoles();
    return () => {
      isMounted = false;
    };
  }, [isOpen, serverId]);

  if (!isOpen) return null;

  const roleOptions: DropdownOption[] = serverRoles.map((r) => ({
    value: r.id,
    label: r.name,
    description: `Position: ${r.position}${r.managed ? ' • Managed Role' : ''}`,
    badge: r.assignableByBot ? 'Assignable' : 'Bot cannot assign',
    disabled: !r.assignableByBot
  }));

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const matched = serverRoles.find((r) => r.id === roleId);
    if (matched) {
      setSelectedRoleName(matched.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this action template.');
      return;
    }

    if (actionType === 'ROLE' && !selectedRoleId.trim()) {
      setError('Please select or specify a target role.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CreateActionPayload = {
      serverId: isGlobal ? undefined : serverId,
      isGlobal,
      name: name.trim(),
      description: description.trim() || undefined,
      actionType,
      roleSubtype: actionType === 'ROLE' ? roleSubtype : undefined,
      roleId: actionType === 'ROLE' ? selectedRoleId.trim() : undefined,
      roleName: actionType === 'ROLE' ? selectedRoleName.trim() : undefined,
      channelPrefix: actionType === 'TICKET' ? channelPrefix.trim() : undefined,
      welcomeMessage: actionType === 'TICKET' ? welcomeMessage.trim() : undefined,
      replyContent: (actionType === 'REPLY' || actionType === 'ROLE') ? replyContent.trim() : undefined,
      isEphemeral,
      dmContent: actionType === 'DM' ? dmContent.trim() : undefined,
      requiredUser,
      requiredRole,
      responseEmbedTemplateId: responseEmbedTemplateId.trim() || undefined
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
        const res = await api.createActionTemplate(payload, serverId);
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
                placeholder="e.g. VIP Role Self-Assign, Support Ticket Opener"
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

            {/* Scope Selection */}
            {serverId && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs font-semibold text-zinc-300">Template Scope:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGlobal(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !isGlobal
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ServerIcon className="w-3.5 h-3.5" />
                    Server-Scoped
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGlobal(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isGlobal
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Global Template
                  </button>
                </div>
              </div>
            )}
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
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Role Assignment Rules
              </h3>

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
                <label className="block text-xs text-zinc-300 mb-1.5">
                  Target Discord Role *
                </label>
                {serverRoles.length > 0 ? (
                  <GlassmorphicDropdown
                    options={roleOptions}
                    value={selectedRoleId}
                    onChange={handleRoleChange}
                    placeholder="Select guild role..."
                    searchable
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      placeholder="Role Snowflake ID (e.g. 104899988877766655)"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={selectedRoleName}
                      onChange={(e) => setSelectedRoleName(e.target.value)}
                      placeholder="Role Name (e.g. VIP Member)"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                )}
                {loadingRoles && (
                  <p className="text-[11px] text-zinc-500 mt-1">Fetching live server roles...</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Feedback / Reply Content</label>
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="e.g. Role {role} has been updated for {user}!"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Variables supported: {`{user}`}, {`{role}`}, {`{server}`}</p>
              </div>
            </div>
          )}

          {actionType === 'TICKET' && (
            <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-4">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Support Ticket Creation
              </h3>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Ticket Channel Prefix</label>
                <input
                  type="text"
                  value={channelPrefix}
                  onChange={(e) => setChannelPrefix(e.target.value)}
                  placeholder="ticket-"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Welcome Message in Ticket</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Welcome {user}! Support staff will be with you shortly."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs resize-none"
                />
              </div>
            </div>
          )}

          {actionType === 'REPLY' && (
            <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 space-y-4">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Bot Response Configuration
              </h3>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Message Content</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Message content to reply with..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs resize-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Variables supported: {`{user}`}, {`{server}`}</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={isEphemeral}
                  onChange={(e) => setIsEphemeral(e.target.checked)}
                  className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-black/40 border-white/10"
                />
                <span>Ephemeral Response (Only visible to the clicking user)</span>
              </label>
            </div>
          )}

          {actionType === 'DM' && (
            <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-4">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" /> Direct Message Configuration
              </h3>

              <div>
                <label className="block text-xs text-zinc-300 mb-1.5">Direct Message Content</label>
                <textarea
                  value={dmContent}
                  onChange={(e) => setDmContent(e.target.value)}
                  placeholder="Direct message to deliver to the user's Discord inbox..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs resize-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  If the member has closed DMs, the bot automatically falls back to an ephemeral channel message.
                </p>
              </div>
            </div>
          )}

          {/* Multi-Select Chaining Requirements */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400" /> Multi-Select Session Dependencies
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">15-min Redis Window</span>
            </div>
            <p className="text-xs text-zinc-400">
              Require the member to interact with select menus on the same message before this action executes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5 cursor-pointer text-xs text-zinc-300 hover:border-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={requiredUser}
                  onChange={(e) => setRequiredUser(e.target.checked)}
                  className="w-4 h-4 rounded text-red-500 bg-black/40 border-white/10"
                />
                <span>Require User Select input</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5 cursor-pointer text-xs text-zinc-300 hover:border-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={requiredRole}
                  onChange={(e) => setRequiredRole(e.target.checked)}
                  className="w-4 h-4 rounded text-red-500 bg-black/40 border-white/10"
                />
                <span>Require Role Select input</span>
              </label>
            </div>
          </div>
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
