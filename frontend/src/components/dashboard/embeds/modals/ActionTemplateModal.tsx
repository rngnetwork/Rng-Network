'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Server as ServerIcon,
  Shield,
  ShieldCheck,
  Ticket,
  MessageSquare,
  Mail,
  Layers,
} from 'lucide-react';
import type {
  ActionType,
  CreateActionPayload,
  EmbedAction,
  RoleSubtype,
  ResponseType,
} from '@/lib/model/action';
import type { TemplateData } from '@/lib/model/embed';
import type { ServerItem } from '@/lib/model/server';
import { fetchServers } from '@/lib/api/dashboard/servers';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';

export interface ActionTemplateModalProps {
  isOpen: boolean;
  initialAction?: EmbedAction | null;
  serverId?: string;
  embedTemplates?: TemplateData[];
  onClose: () => void;
  onSubmit: (payload: CreateActionPayload) => Promise<void> | void;
}

const ACTION_TYPE_OPTIONS: { label: string; value: ActionType }[] = [
  { label: 'Role Grant', value: 'ROLE' },
  { label: 'Role Verify', value: 'ROLE_VERIFY' },
  { label: 'Private Ticket', value: 'TICKET' },
  { label: 'Bot Reply', value: 'REPLY' },
  { label: 'Bot DM', value: 'DM' },
];

const RESPONSE_TYPE_OPTIONS: DropdownOption<ResponseType>[] = [
  { label: 'Public Embed', value: 'PUBLIC_EMBED' },
  { label: 'Ephemeral Embed', value: 'EPHEMERAL_EMBED' },
  { label: 'Direct Message Embed', value: 'DM_EMBED' },
];

export const ActionTemplateModal: React.FC<ActionTemplateModalProps> = ({
  isOpen,
  initialAction,
  serverId,
  embedTemplates = [],
  onClose,
  onSubmit,
}) => {
  const [prevInitialAction, setPrevInitialAction] = useState(initialAction);
  const [name, setName] = useState(initialAction?.name ?? '');
  const [description, setDescription] = useState(initialAction?.description ?? '');
  const [actionType, setActionType] = useState<ActionType>(initialAction?.actionType ?? 'ROLE');
  const [isGlobal, setIsGlobal] = useState(
    initialAction ? Boolean(initialAction.isGlobal) : !serverId
  );

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
  const [roleSubtype, setRoleSubtype] = useState<RoleSubtype>(initialAction?.roleSubtype ?? 'TOGGLE');
  const [roleFeedback, setRoleFeedback] = useState(initialAction?.replyContent ?? '');

  // Role Verify specific
  const [roleVerifyId, setRoleVerifyId] = useState(initialAction?.roleId ?? '');

  // Ticket specific
  const [channelPrefix, setChannelPrefix] = useState(initialAction?.channelPrefix ?? 'ticket-');
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialAction?.welcomeMessage ?? 'Welcome {user} to support!'
  );
  const [dmContent, setDmContent] = useState(initialAction?.dmContent ?? '');

  // Shared Response & Follow-Up Configuration (Role & Ticket & Role Verify)
  const [responseType, setResponseType] = useState<ResponseType>(
    initialAction?.responseType ?? 'PUBLIC_EMBED'
  );
  const [responseEmbedTemplateId, setResponseEmbedTemplateId] = useState(
    initialAction?.responseEmbedTemplateId ?? ''
  );

  // Reply specific
  const [replyMode, setReplyMode] = useState<'TEXT' | 'EMBED'>(
    initialAction?.actionType === 'REPLY' && initialAction?.responseEmbedTemplateId
      ? 'EMBED'
      : 'TEXT'
  );
  const [replyContent, setReplyContent] = useState(initialAction?.replyContent ?? '');
  const [isEphemeral, setIsEphemeral] = useState(initialAction?.isEphemeral ?? true);

  // DM specific
  const [dmMode, setDmMode] = useState<'TEXT' | 'EMBED'>(
    initialAction?.actionType === 'DM' && initialAction?.responseEmbedTemplateId
      ? 'EMBED'
      : 'TEXT'
  );
  const [botDmText, setBotDmText] = useState(initialAction?.dmContent ?? '');
  const [dispatchDMLogsWithFallback, setDispatchDMLogsWithFallback] = useState(
    initialAction?.dispatchDMLogsWithFallback ?? true
  );

  const [submitting, setSubmitting] = useState(false);

  // Reset state when editing target changes
  if (initialAction !== prevInitialAction) {
    setPrevInitialAction(initialAction);
    setName(initialAction?.name ?? '');
    setDescription(initialAction?.description ?? '');
    setIsGlobal(initialAction ? Boolean(initialAction.isGlobal) : !serverId);
    setSelectedServerIds(
      initialAction?.serverIds && initialAction.serverIds.length > 0
        ? initialAction.serverIds
        : initialAction?.serverId
        ? [initialAction.serverId]
        : serverId
        ? [serverId]
        : []
    );
    setActionType(initialAction?.actionType ?? 'ROLE');
    setRoleSubtype(initialAction?.roleSubtype ?? 'TOGGLE');
    setRoleFeedback(initialAction?.replyContent ?? '');
    setRoleVerifyId(initialAction?.roleId ?? '');
    setChannelPrefix(initialAction?.channelPrefix ?? 'ticket-');
    setWelcomeMessage(
      initialAction?.welcomeMessage ?? 'Welcome {user} to support!'
    );
    setDmContent(initialAction?.dmContent ?? '');
    setResponseType(initialAction?.responseType ?? 'PUBLIC_EMBED');
    setResponseEmbedTemplateId(initialAction?.responseEmbedTemplateId ?? '');
    setReplyMode(
      initialAction?.actionType === 'REPLY' && initialAction?.responseEmbedTemplateId
        ? 'EMBED'
        : 'TEXT'
    );
    setReplyContent(initialAction?.replyContent ?? '');
    setIsEphemeral(initialAction?.isEphemeral ?? true);
    setDmMode(
      initialAction?.actionType === 'DM' && initialAction?.responseEmbedTemplateId
        ? 'EMBED'
        : 'TEXT'
    );
    setBotDmText(initialAction?.dmContent ?? '');
    setDispatchDMLogsWithFallback(initialAction?.dispatchDMLogsWithFallback ?? true);
  }

  // Load connected servers
  useEffect(() => {
    let active = true;
    if (isOpen) {
      fetchServers()
        .then((res) => {
          if (active && res.success && Array.isArray(res.data)) {
            setConnectedServers(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoadingServers(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleToggleServer = (id: string) => {
    setSelectedServerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const templateOptions: DropdownOption<string>[] = [
    { label: 'None (Default Confirmation)', value: '' },
    ...embedTemplates.map((t) => ({
      label: t.name,
      value: t.id || t.templateId || '',
      description: t.category ? `Category: ${t.category}` : undefined,
    })),
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (actionType === 'ROLE_VERIFY' && !roleVerifyId.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const assignedServers = isGlobal
        ? []
        : selectedServerIds.length > 0
        ? selectedServerIds
        : serverId
        ? [serverId]
        : [];

      const basePayload: CreateActionPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        actionType,
        isGlobal,
        serverId: !isGlobal && assignedServers.length > 0 ? assignedServers[0] : undefined,
        serverIds: assignedServers,
      };

      let finalPayload: CreateActionPayload = { ...basePayload };

      if (actionType === 'ROLE') {
        finalPayload = {
          ...basePayload,
          roleSubtype,
          replyContent: roleFeedback.trim() || undefined,
          responseType,
          responseEmbedTemplateId: responseEmbedTemplateId || undefined,
          requiredRole: true,
        };
      } else if (actionType === 'ROLE_VERIFY') {
        finalPayload = {
          ...basePayload,
          roleId: roleVerifyId.trim(),
          responseType,
          responseEmbedTemplateId: responseEmbedTemplateId || undefined,
          requiredRole: false,
          requiredUser: false,
        };
      } else if (actionType === 'TICKET') {
        finalPayload = {
          ...basePayload,
          channelPrefix: channelPrefix.trim() || 'ticket-',
          welcomeMessage: welcomeMessage.trim() || undefined,
          dmContent: dmContent.trim() || undefined,
          responseType,
          responseEmbedTemplateId: responseEmbedTemplateId || undefined,
          dispatchDMLogsWithFallback: true,
        };
      } else if (actionType === 'REPLY') {
        finalPayload = {
          ...basePayload,
          replyContent: replyMode === 'TEXT' ? replyContent.trim() || undefined : undefined,
          responseEmbedTemplateId: replyMode === 'EMBED' ? responseEmbedTemplateId || undefined : undefined,
          responseType: replyMode === 'EMBED' ? (isEphemeral ? 'EPHEMERAL_EMBED' : 'PUBLIC_EMBED') : (isEphemeral ? 'EPHEMERAL_TEXT' : 'PUBLIC_TEXT'),
          isEphemeral,
        };
      } else if (actionType === 'DM') {
        finalPayload = {
          ...basePayload,
          dmContent: dmMode === 'TEXT' ? botDmText.trim() || undefined : undefined,
          responseEmbedTemplateId: dmMode === 'EMBED' ? responseEmbedTemplateId || undefined : undefined,
          responseType: dmMode === 'EMBED' ? 'DM_EMBED' : 'EPHEMERAL_TEXT',
          dispatchDMLogsWithFallback,
        };
      }

      await onSubmit(finalPayload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAction ? 'Edit Action Template' : 'New Action Template'}
      description="Configure interactive button or select menu action behavior."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={!name.trim() || (actionType === 'ROLE_VERIFY' && !roleVerifyId.trim())}
            onClick={handleFormSubmit}
          >
            Save Template
          </Button>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        {/* Template Name */}
        <TextInput
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dynamic Role Grant Pipeline"
          maxLength={100}
          required
        />

        {/* Template Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">Template Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this interactive action does..."
            rows={2}
            maxLength={500}
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-brand-red focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Action Template Scope */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300">Action Template Scope</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsGlobal(true)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                isGlobal
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Globe size={14} />
              Global
            </button>
            <button
              type="button"
              onClick={() => setIsGlobal(false)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                !isGlobal
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <ServerIcon size={14} />
              Server-Specific
            </button>
          </div>
        </div>

        {/* Server's Dropdown (Visible strictly when Scope == Server-Specific) */}
        {!isGlobal && (
          <div className="p-3.5 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ServerIcon size={14} className="text-zinc-400" />
                Discord Servers Assigned
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {selectedServerIds.length} selected
              </span>
            </div>

            {loadingServers ? (
              <span className="text-xs text-zinc-500 py-1">Loading servers...</span>
            ) : connectedServers.length === 0 ? (
              <span className="text-xs text-zinc-500 py-1">
                No connected servers found. Current server context will be used.
              </span>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {connectedServers.map((srv) => {
                  const isChecked = selectedServerIds.includes(srv.id);
                  return (
                    <label
                      key={srv.id}
                      className={`flex items-center gap-2.5 p-2 rounded-apple-md border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-brand-red/10 border-brand-red/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleServer(srv.id)}
                        className="w-3.5 h-3.5 rounded bg-black/60 border border-white/20 text-brand-red focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="truncate">{srv.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Type: Role Grant | Role Verify | Private Ticket | Bot Reply | Bot DM */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300">Action Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ACTION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActionType(opt.value)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                  actionType === opt.value
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {opt.value === 'ROLE' && <Shield size={14} />}
                {opt.value === 'ROLE_VERIFY' && <ShieldCheck size={14} />}
                {opt.value === 'TICKET' && <Ticket size={14} />}
                {opt.value === 'REPLY' && <MessageSquare size={14} />}
                {opt.value === 'DM' && <Mail size={14} />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Sub-form: Role Grant */}
        {actionType === 'ROLE' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-4">
            {/* Operation: TOGGLE | ADD | REMOVE */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Operation</label>
              <div className="grid grid-cols-3 gap-2">
                {(['TOGGLE', 'ADD', 'REMOVE'] as RoleSubtype[]).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setRoleSubtype(op)}
                    className={`py-1.5 px-3 rounded-apple-md text-xs font-bold transition-all cursor-pointer ${
                      roleSubtype === op
                        ? 'bg-brand-red text-white shadow-sm'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback: single line text input */}
            <TextInput
              label="Feedback"
              value={roleFeedback}
              onChange={(e) => setRoleFeedback(e.target.value)}
              placeholder="Variables supported: {targetUser}, {user}, {targetRole}, {server}, {channel}"
            />

            {/* Response Section */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Layers size={14} className="text-brand-red" />
                Response Section
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Dropdown
                  label="Response Type"
                  options={RESPONSE_TYPE_OPTIONS}
                  value={responseType}
                  onChange={(val) => setResponseType(val as ResponseType)}
                />
                <Dropdown
                  label="Embed Template"
                  options={templateOptions}
                  value={responseEmbedTemplateId}
                  onChange={setResponseEmbedTemplateId}
                  placeholder="Select embed template..."
                  searchable
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Sub-form: Role Verify */}
        {actionType === 'ROLE_VERIFY' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-4">
            {/* Verification Role ID */}
            <TextInput
              label="Verification Role ID"
              value={roleVerifyId}
              onChange={(e) => setRoleVerifyId(e.target.value)}
              placeholder="e.g. 110293847561829384"
              maxLength={25}
              required
              helperText="Discord Snowflake Role ID granted to members when they click this verify button/option."
            />

            {/* Response Section */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Layers size={14} className="text-brand-red" />
                Response Section
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Dropdown
                  label="Response Type"
                  options={RESPONSE_TYPE_OPTIONS}
                  value={responseType}
                  onChange={(val) => setResponseType(val as ResponseType)}
                />
                <Dropdown
                  label="Embed Template"
                  options={templateOptions}
                  value={responseEmbedTemplateId}
                  onChange={setResponseEmbedTemplateId}
                  placeholder="Select embed template..."
                  searchable
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Sub-form: Private Ticket */}
        {actionType === 'TICKET' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Ticket size={14} className="text-brand-red" />
              SUPPORT TICKET CREATION
            </div>

            {/* Ticket Channel Name / Pattern */}
            <div>
              <TextInput
                label="Ticket Channel Name / Pattern"
                value={channelPrefix}
                onChange={(e) => setChannelPrefix(e.target.value)}
                placeholder="ticket-"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Custom exact name (e.g. ticket-0017) or dynamic pattern using {'{hexCode}'} or {'{username}'}.
              </p>
            </div>

            {/* Welcome Message in Ticket */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Welcome Message in Ticket</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Welcome {user} to support!"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-brand-red focus:outline-none transition-colors resize-none"
              />
              <p className="text-[10px] text-zinc-500">
                Variables supported: {'{user}'}, {'{username}'}, {'{targetUser}'}, {'{targetRole}'}, {'{server}'}, {'{channel}'}
              </p>
            </div>

            {/* Direct Message Notification / Audit Log (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Direct Message Notification / Audit Log (Optional)
              </label>
              <textarea
                value={dmContent}
                onChange={(e) => setDmContent(e.target.value)}
                placeholder="e.g. A support ticket has been opened for {targetUser} regarding role {targetRole}."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-brand-red focus:outline-none transition-colors resize-none"
              />
              <p className="text-[10px] text-zinc-500">
                Variables supported: {'{user}'}, {'{targetUser}'}, {'{targetRole}'}, {'{server}'}, {'{channel}'}. Delivered to operator via DM.
              </p>
            </div>

            {/* Response Section */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Layers size={14} className="text-brand-red" />
                Response Section
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Dropdown
                  label="Response Type"
                  options={RESPONSE_TYPE_OPTIONS}
                  value={responseType}
                  onChange={(val) => setResponseType(val as ResponseType)}
                />
                <Dropdown
                  label="Follow-Up Embed Template"
                  options={templateOptions}
                  value={responseEmbedTemplateId}
                  onChange={setResponseEmbedTemplateId}
                  placeholder="Select embed template..."
                  searchable
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Sub-form: Bot Reply */}
        {actionType === 'REPLY' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <MessageSquare size={14} className="text-brand-red" />
              BOT REPLY CONFIGURATION
            </div>

            {/* Delivery Mode: Text Message vs Embedded Message */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReplyMode('TEXT')}
                className={`py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                  replyMode === 'TEXT'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                Text Message
              </button>
              <button
                type="button"
                onClick={() => setReplyMode('EMBED')}
                className={`py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                  replyMode === 'EMBED'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                Embedded Message
              </button>
            </div>

            {/* Content Field depending on Mode */}
            {replyMode === 'TEXT' ? (
              <TextInput
                label="Message Content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Variables supported: {user}, {server}, {channel}"
              />
            ) : (
              <Dropdown
                label="Follow-Up Embed Template"
                options={templateOptions}
                value={responseEmbedTemplateId}
                onChange={setResponseEmbedTemplateId}
                placeholder="Select embed template..."
                searchable
              />
            )}

            {/* Ephemeral Toggle */}
            <ToggleSwitch
              checked={isEphemeral}
              onChange={setIsEphemeral}
              label="Is this message ephemeral?"
              description="Only visible to the interacting user"
            />
          </div>
        )}

        {/* Conditional Sub-form: Bot DM */}
        {actionType === 'DM' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Mail size={14} className="text-brand-red" />
              DIRECT MESSAGE CONFIGURATION
            </div>

            {/* Delivery Mode: Text Message vs Embedded Message */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDmMode('TEXT')}
                className={`py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                  dmMode === 'TEXT'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                Text Message
              </button>
              <button
                type="button"
                onClick={() => setDmMode('EMBED')}
                className={`py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                  dmMode === 'EMBED'
                    ? 'bg-brand-red text-white shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                Embedded Message
              </button>
            </div>

            {/* Content Field depending on Mode */}
            {dmMode === 'TEXT' ? (
              <TextInput
                label="DM Content"
                value={botDmText}
                onChange={(e) => setBotDmText(e.target.value)}
                placeholder="Variables supported: {user}, {server}, {channel}"
              />
            ) : (
              <Dropdown
                label="Follow-Up Embed Template"
                options={templateOptions}
                value={responseEmbedTemplateId}
                onChange={setResponseEmbedTemplateId}
                placeholder="Select embed template..."
                searchable
              />
            )}

            {/* Closed DMs Fallback Toggle */}
            <ToggleSwitch
              checked={dispatchDMLogsWithFallback}
              onChange={setDispatchDMLogsWithFallback}
              label="Automatic Ticket Channel Fallback"
              description="Deliver payload into provisioned ticket channel if Discord Error 50007 occurs"
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
