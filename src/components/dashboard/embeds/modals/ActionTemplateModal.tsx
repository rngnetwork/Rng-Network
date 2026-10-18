'use client';

import React, { useState, useEffect } from 'react';
import {
  Server as ServerIcon,
  Shield,
  Ticket,
  MessageSquare,
  Mail,
  UserCheck,
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

const ACTION_TYPE_OPTIONS: DropdownOption<ActionType>[] = [
  { label: 'Role Grant / Toggle (ROLE)', value: 'ROLE' },
  { label: 'Support Ticket Channel (TICKET)', value: 'TICKET' },
  { label: 'Bot Reply Message (REPLY)', value: 'REPLY' },
  { label: 'Bot Direct Message (DM)', value: 'DM' },
];

const ROLE_SUBTYPE_OPTIONS: DropdownOption<RoleSubtype>[] = [
  { label: 'Toggle Role (TOGGLE)', value: 'TOGGLE' },
  { label: 'Grant Role Only (ADD)', value: 'ADD' },
  { label: 'Remove Role Only (REMOVE)', value: 'REMOVE' },
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

  // Ticket specific
  const [channelPrefix, setChannelPrefix] = useState(initialAction?.channelPrefix ?? 'ticket-');
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialAction?.welcomeMessage ??
      'Welcome {user}! Support staff will assist you shortly.'
  );

  // Delivery Format & Message Content
  const [deliveryFormat, setDeliveryFormat] = useState<'TEXT' | 'EMBED'>(
    initialAction?.responseEmbedTemplateId ? 'EMBED' : 'TEXT'
  );
  const [replyContent, setReplyContent] = useState(initialAction?.replyContent ?? '');
  const [dmContent, setDmContent] = useState(initialAction?.dmContent ?? '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialAction?.responseEmbedTemplateId ?? ''
  );
  const [isEphemeral, setIsEphemeral] = useState(initialAction?.isEphemeral ?? true);
  const [dispatchDMLogsWithFallback, setDispatchDMLogsWithFallback] = useState(
    initialAction?.dispatchDMLogsWithFallback ?? true
  );

  // Multi-select Session Chaining Prerequisites
  const [requiredUser, setRequiredUser] = useState(Boolean(initialAction?.requiredUser));
  const [requiredRole, setRequiredRole] = useState(
    initialAction?.requiredRole !== undefined ? Boolean(initialAction.requiredRole) : true
  );
  const [confirmationMessage, setConfirmationMessage] = useState(
    initialAction?.confirmationMessage ?? ''
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
    setChannelPrefix(initialAction?.channelPrefix ?? 'ticket-');
    setWelcomeMessage(
      initialAction?.welcomeMessage ??
        'Welcome {user}! Support staff will assist you shortly.'
    );
    setDeliveryFormat(initialAction?.responseEmbedTemplateId ? 'EMBED' : 'TEXT');
    setReplyContent(initialAction?.replyContent ?? '');
    setDmContent(initialAction?.dmContent ?? '');
    setSelectedTemplateId(initialAction?.responseEmbedTemplateId ?? '');
    setIsEphemeral(initialAction?.isEphemeral ?? true);
    setDispatchDMLogsWithFallback(initialAction?.dispatchDMLogsWithFallback ?? true);
    setRequiredUser(Boolean(initialAction?.requiredUser));
    setRequiredRole(
      initialAction?.requiredRole !== undefined ? Boolean(initialAction.requiredRole) : true
    );
    setConfirmationMessage(initialAction?.confirmationMessage ?? '');
  }

  // Load connected servers for multi-server assignment
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoadingServers(true);
      fetchServers()
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            setConnectedServers(res.data);
          }
        })
        .catch(() => {
          // Fallback handled cleanly
        })
        .finally(() => {
          if (isMounted) setLoadingServers(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const templateOptions: DropdownOption<string>[] = embedTemplates.map((t) => ({
    label: t.name,
    value: t.id,
    description: `Category: ${t.category || 'GENERAL'}`,
  }));

  const handleToggleServer = (sId: string) => {
    setSelectedServerIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const handleFormSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      let responseType: ResponseType | undefined;
      if (actionType === 'REPLY' || actionType === 'ROLE') {
        if (deliveryFormat === 'EMBED') {
          responseType = isEphemeral ? 'EPHEMERAL_EMBED' : 'PUBLIC_EMBED';
        } else {
          responseType = isEphemeral ? 'EPHEMERAL_TEXT' : 'PUBLIC_TEXT';
        }
      } else if (actionType === 'DM') {
        responseType = deliveryFormat === 'EMBED' ? 'DM_EMBED' : 'PUBLIC_TEXT';
      }

      const assignedServers = isGlobal
        ? []
        : selectedServerIds.length > 0
        ? selectedServerIds
        : serverId
        ? [serverId]
        : [];

      const payload: CreateActionPayload = {
        serverId: isGlobal ? undefined : assignedServers[0],
        serverIds: assignedServers,
        isGlobal,
        name: name.trim(),
        description: description.trim() || undefined,
        actionType,
        requiredUser,
        requiredRole: actionType === 'ROLE' ? true : requiredRole,
        confirmationMessage: confirmationMessage.trim() || undefined,
        ...(actionType === 'ROLE'
          ? {
              roleSubtype,
              replyContent: replyContent.trim() || undefined,
              responseType,
              isEphemeral,
              responseEmbedTemplateId:
                deliveryFormat === 'EMBED' && selectedTemplateId
                  ? selectedTemplateId
                  : undefined,
            }
          : {}),
        ...(actionType === 'TICKET'
          ? {
              channelPrefix: channelPrefix.trim() || 'ticket-',
              welcomeMessage: welcomeMessage.trim(),
              dmContent: dmContent.trim() || undefined,
              responseType,
              responseEmbedTemplateId:
                deliveryFormat === 'EMBED' && selectedTemplateId
                  ? selectedTemplateId
                  : undefined,
            }
          : {}),
        ...(actionType === 'REPLY'
          ? {
              responseType,
              isEphemeral,
              replyContent: deliveryFormat === 'TEXT' ? replyContent.trim() : undefined,
              responseEmbedTemplateId:
                deliveryFormat === 'EMBED' && selectedTemplateId
                  ? selectedTemplateId
                  : undefined,
            }
          : {}),
        ...(actionType === 'DM'
          ? {
              responseType,
              dmContent: deliveryFormat === 'TEXT' ? dmContent.trim() : undefined,
              responseEmbedTemplateId:
                deliveryFormat === 'EMBED' && selectedTemplateId
                  ? selectedTemplateId
                  : undefined,
              dispatchDMLogsWithFallback,
            }
          : {}),
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialAction
          ? `Edit Action (${initialAction.actionId})`
          : 'New Action Template'
      }
      description="Configure button or select menu action."
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
            disabled={!name.trim()}
            onClick={handleFormSubmit}
          >
            {initialAction ? 'Save Action' : 'Create Action'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Row 1: Name and Action Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Action Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dynamic Role Grant"
            required
          />
          <Dropdown
            label="Action Type"
            options={ACTION_TYPE_OPTIONS}
            value={actionType}
            onChange={setActionType}
          />
        </div>

        {/* Global Scope Toggle */}
        <div className="p-3.5 rounded-apple-lg bg-surface-card border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white">Global Action</span>
            <p className="text-[11px] text-zinc-400">
              Available across all connected servers
            </p>
          </div>
          <ToggleSwitch checked={isGlobal} onChange={setIsGlobal} />
        </div>

        {/* Multi-Server Scoping when NOT global */}
        {!isGlobal && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ServerIcon size={14} className="text-zinc-400" />
                Target Discord Servers
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {selectedServerIds.length} assigned
              </span>
            </div>

            {loadingServers ? (
              <span className="text-xs text-zinc-500 py-2">Loading servers...</span>
            ) : connectedServers.length === 0 ? (
              <span className="text-xs text-zinc-500 py-2">
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
                        className="w-3.5 h-3.5 rounded bg-black/60 border border-white/20 text-brand-red focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="truncate">{srv.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <TextInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this action..."
        />

        {/* ROLE Specific Configuration */}
        {actionType === 'ROLE' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Shield size={14} className="text-brand-red" />
              Role Mutation Settings
            </div>

            <Dropdown
              label="Role Mode"
              options={ROLE_SUBTYPE_OPTIONS}
              value={roleSubtype}
              onChange={setRoleSubtype}
            />

            <TextInput
              label="Confirmation Message"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="e.g. Role {targetRole} updated for {targetUser}"
            />
          </div>
        )}

        {/* TICKET Specific Configuration */}
        {actionType === 'TICKET' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Ticket size={14} className="text-brand-red" />
              Ticket Channel Settings
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Channel Prefix"
                value={channelPrefix}
                onChange={(e) => setChannelPrefix(e.target.value)}
                placeholder="ticket-"
              />
              <TextInput
                label="DM Audit Log (Optional)"
                value={dmContent}
                onChange={(e) => setDmContent(e.target.value)}
                placeholder="Ticket opened for {user}"
              />
            </div>

            <TextInput
              label="Greeting Message"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome {user}! Staff will assist you shortly."
            />
          </div>
        )}

        {/* REPLY / DM Specific Configuration */}
        {(actionType === 'REPLY' || actionType === 'DM') && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                {actionType === 'REPLY' ? (
                  <MessageSquare size={14} className="text-brand-red" />
                ) : (
                  <Mail size={14} className="text-brand-red" />
                )}
                {actionType === 'REPLY' ? 'Reply Settings' : 'Direct Message Settings'}
              </div>

              {/* Delivery Format Pills */}
              <div className="inline-flex rounded-apple-md bg-zinc-900 p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setDeliveryFormat('TEXT')}
                  className={`px-3 py-1 rounded-apple-sm text-xs font-semibold transition-colors cursor-pointer ${
                    deliveryFormat === 'TEXT'
                      ? 'bg-brand-red text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFormat('EMBED')}
                  className={`px-3 py-1 rounded-apple-sm text-xs font-semibold transition-colors cursor-pointer ${
                    deliveryFormat === 'EMBED'
                      ? 'bg-brand-red text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Embed
                </button>
              </div>
            </div>

            {deliveryFormat === 'TEXT' ? (
              <TextInput
                label={actionType === 'REPLY' ? 'Reply Content' : 'DM Content'}
                value={actionType === 'REPLY' ? replyContent : dmContent}
                onChange={(e) =>
                  actionType === 'REPLY' ? setReplyContent(e.target.value) : setDmContent(e.target.value)
                }
                placeholder="Message content..."
              />
            ) : (
              <Dropdown
                label="Follow-Up Embed Template"
                options={templateOptions}
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                placeholder="Select saved template..."
                searchable
              />
            )}

            {actionType === 'REPLY' && (
              <ToggleSwitch
                checked={isEphemeral}
                onChange={setIsEphemeral}
                label="Ephemeral reply"
                description="Only visible to the interacting user"
              />
            )}

            {actionType === 'DM' && (
              <ToggleSwitch
                checked={dispatchDMLogsWithFallback}
                onChange={setDispatchDMLogsWithFallback}
                label="Ticket channel fallback"
                description="Deliver to ticket channel if direct messages are closed (Error 50007)"
              />
            )}
          </div>
        )}

        {/* Multi-Select Session Chaining Prerequisites */}
        <div className="p-4 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <UserCheck size={14} className="text-brand-red" />
            Session Prerequisites
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-xs text-white">Require User Selection</span>
              <ToggleSwitch checked={requiredUser} onChange={setRequiredUser} size="sm" />
            </div>

            <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <span className="text-xs text-white">Require Role Selection</span>
              <ToggleSwitch
                checked={actionType === 'ROLE' ? true : requiredRole}
                onChange={setRequiredRole}
                disabled={actionType === 'ROLE'}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
