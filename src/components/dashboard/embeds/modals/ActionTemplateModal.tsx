'use client';

import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type {
  ActionType,
  CreateActionPayload,
  EmbedAction,
  RoleSubtype,
  ResponseType,
} from '@/lib/model/action';
import type { TemplateData } from '@/lib/model/embed';
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
  {
    label: 'Role Grant / Toggle (ROLE)',
    value: 'ROLE',
    description: 'Enforces pure Discord role hierarchy with dynamic RoleSelect',
  },
  {
    label: 'Support Ticket Channel (TICKET)',
    value: 'TICKET',
    description: 'Provisions private dual-member support ticket channel',
  },
  {
    label: 'Bot Reply Message (REPLY)',
    value: 'REPLY',
    description: 'Sends either a Text Message OR an Embedded Message reply',
  },
  {
    label: 'Bot Direct Message (DM)',
    value: 'DM',
    description: 'Dispatches direct message with Discord Error 50007 fallback',
  },
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
  const [description, setDescription] = useState(
    initialAction?.description ?? ''
  );
  const [actionType, setActionType] = useState<ActionType>(
    initialAction?.actionType ?? 'REPLY'
  );
  const [roleSubtype, setRoleSubtype] = useState<RoleSubtype>(
    initialAction?.roleSubtype ?? 'TOGGLE'
  );
  const [channelPrefix, setChannelPrefix] = useState(
    initialAction?.channelPrefix ?? 'ticket'
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialAction?.welcomeMessage ??
      'Welcome {user}, High Command personnel will assist you shortly.'
  );
  const [deliveryFormat, setDeliveryFormat] = useState<'TEXT' | 'EMBED'>(
    initialAction?.responseEmbedTemplateId ? 'EMBED' : 'TEXT'
  );
  const [messageText, setMessageText] = useState(
    initialAction?.replyContent || initialAction?.dmContent || ''
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialAction?.responseEmbedTemplateId ?? ''
  );
  const [isEphemeral, setIsEphemeral] = useState(
    initialAction?.isEphemeral ?? true
  );
  const [dispatchDMLogsWithFallback, setDispatchDMLogsWithFallback] = useState(
    initialAction?.dispatchDMLogsWithFallback ?? true
  );
  const [submitting, setSubmitting] = useState(false);

  if (initialAction !== prevInitialAction) {
    setPrevInitialAction(initialAction);
    setName(initialAction?.name ?? '');
    setDescription(initialAction?.description ?? '');
    setActionType(initialAction?.actionType ?? 'REPLY');
    setRoleSubtype(initialAction?.roleSubtype ?? 'TOGGLE');
    setChannelPrefix(initialAction?.channelPrefix ?? 'ticket');
    setWelcomeMessage(
      initialAction?.welcomeMessage ??
        'Welcome {user}, High Command personnel will assist you shortly.'
    );
    setDeliveryFormat(
      initialAction?.responseEmbedTemplateId ? 'EMBED' : 'TEXT'
    );
    setMessageText(
      initialAction?.replyContent || initialAction?.dmContent || ''
    );
    setSelectedTemplateId(initialAction?.responseEmbedTemplateId ?? '');
    setIsEphemeral(initialAction?.isEphemeral ?? true);
    setDispatchDMLogsWithFallback(
      initialAction?.dispatchDMLogsWithFallback ?? true
    );
  }

  const templateOptions: DropdownOption<string>[] = embedTemplates.map((t) => ({
    label: t.name,
    value: t.id,
    description: `Category: ${t.category || 'GENERAL'}`,
  }));

  const handleFormSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      let responseType: ResponseType | undefined;
      if (actionType === 'REPLY') {
        if (deliveryFormat === 'EMBED') {
          responseType = isEphemeral ? 'EPHEMERAL_EMBED' : 'PUBLIC_EMBED';
        } else {
          responseType = isEphemeral ? 'EPHEMERAL_TEXT' : 'PUBLIC_TEXT';
        }
      } else if (actionType === 'DM') {
        responseType =
          deliveryFormat === 'EMBED' ? 'DM_EMBED' : 'PUBLIC_TEXT';
      }

      const payload: CreateActionPayload = {
        serverId,
        name: name.trim(),
        description: description.trim() || undefined,
        actionType,
        ...(actionType === 'ROLE'
          ? { roleSubtype, requiredRole: true }
          : {}),
        ...(actionType === 'TICKET'
          ? {
              channelPrefix: channelPrefix.trim() || 'ticket',
              welcomeMessage: welcomeMessage.trim(),
            }
          : {}),
        ...(actionType === 'REPLY'
          ? {
              responseType,
              isEphemeral,
              replyContent:
                deliveryFormat === 'TEXT' ? messageText.trim() : undefined,
              responseEmbedTemplateId:
                deliveryFormat === 'EMBED' ? selectedTemplateId : undefined,
            }
          : {}),
        ...(actionType === 'DM'
          ? {
              responseType,
              dmContent:
                deliveryFormat === 'TEXT' ? messageText.trim() : undefined,
              responseEmbedTemplateId:
                deliveryFormat === 'EMBED' ? selectedTemplateId : undefined,
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
          ? `Edit Action Template (${initialAction.actionId})`
          : 'Create Action Registry Template (rng_act_*)'
      }
      description="Decouple button and select menu interactions from static message payloads."
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
            {initialAction ? 'Update Action' : 'Register Action'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Action Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grant Ministry Role"
          />
          <Dropdown
            label="Interaction Action Type"
            options={ACTION_TYPE_OPTIONS}
            value={actionType}
            onChange={setActionType}
          />
        </div>

        <TextInput
          label="Operational Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this rng_act_* identifier executes..."
        />

        {actionType === 'ROLE' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.08] flex flex-col gap-3">
            <Dropdown
              label="Role Mutation Mode"
              options={ROLE_SUBTYPE_OPTIONS}
              value={roleSubtype}
              onChange={setRoleSubtype}
            />
            <p className="text-xs text-zinc-400">
              Pure Discord Role Hierarchy Invariant: Target role is dynamically resolved from an interactive <code className="font-mono text-zinc-200">RoleSelect</code> menu on the embed and verified against <code className="font-mono text-zinc-200">canOperatorAssignRole</code>.
            </p>
          </div>
        )}

        {actionType === 'TICKET' && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.08] flex flex-col gap-3">
            <TextInput
              label="Ticket Channel Prefix"
              value={channelPrefix}
              onChange={(e) => setChannelPrefix(e.target.value)}
              placeholder="ticket"
            />
            <TextInput
              label="Initial Ticket Channel Greeting"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome {user}..."
              helperText="Variables supported: {user}, {server}, {channel}"
            />
          </div>
        )}

        {(actionType === 'REPLY' || actionType === 'DM') && (
          <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.08] flex flex-col gap-4">
            <div className="inline-flex rounded-apple-md bg-zinc-900 p-1 border border-white/10 self-start">
              <button
                type="button"
                onClick={() => setDeliveryFormat('TEXT')}
                className={`px-3 py-1.5 rounded-apple-sm text-xs font-semibold transition-colors ${
                  deliveryFormat === 'TEXT'
                    ? 'bg-brand-red text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Text Message
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFormat('EMBED')}
                className={`px-3 py-1.5 rounded-apple-sm text-xs font-semibold transition-colors ${
                  deliveryFormat === 'EMBED'
                    ? 'bg-brand-red text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Embedded Message
              </button>
            </div>

            {deliveryFormat === 'TEXT' ? (
              <TextInput
                label="Message Content"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                helperText="Variables supported: {user}, {server}, {channel}, {targetRole}"
              />
            ) : (
              <Dropdown
                label="Select Components V2 Embed Template"
                options={templateOptions}
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                placeholder="Select saved embed template..."
                searchable
              />
            )}

            {actionType === 'REPLY' && (
              <ToggleSwitch
                checked={isEphemeral}
                onChange={setIsEphemeral}
                label="Is this message ephemeral?"
                description="When enabled, only the interacting user can see the bot reply"
              />
            )}

            {actionType === 'DM' && (
              <div className="p-3.5 rounded-apple-md bg-amber-500/10 border border-amber-500/25 flex flex-col gap-3">
                <div className="flex items-start gap-2.5 text-xs text-amber-200">
                  <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Discord Error 50007 (Closed DMs) Protection:</strong> Target members may have server direct messages disabled in their privacy settings.
                  </span>
                </div>
                <ToggleSwitch
                  size="sm"
                  checked={dispatchDMLogsWithFallback}
                  onChange={setDispatchDMLogsWithFallback}
                  label="Automatic Ticket Channel Fallback (dispatchDMLogsWithFallback)"
                  description="Deliver DM payload into the provisioned private ticket channel if Error 50007 occurs"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
