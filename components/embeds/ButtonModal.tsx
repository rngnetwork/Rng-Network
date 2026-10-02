"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  DiscordButtonComponent,
  ButtonStyle,
  ComponentActionPayload,
  ComponentActionType,
  RoleActionSubtype,
  GuildRoleOption,
  PartialEmojiObject
} from './types';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';
import { EmojiItem } from './emoji-data';
import { GlassmorphicDropdown, DropdownOption } from '@/components/ui/GlassmorphicDropdown';
import { api } from '@/lib/api';

interface ButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonData: DiscordButtonComponent | null;
  onSave: (updated: DiscordButtonComponent) => void;
  serverId?: string;
}

function getInitialEmojiStr(emoji: DiscordButtonComponent['emoji']): string {
  if (typeof emoji === 'string') return emoji;
  if (emoji && typeof emoji === 'object') {
    return emoji.id ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : (emoji.name || '');
  }
  return '';
}

export function ButtonModal({
  isOpen,
  onClose,
  buttonData,
  onSave,
  serverId
}: ButtonModalProps) {
  if (!isOpen || !buttonData) return null;

  return (
    <ButtonModalContent
      buttonData={buttonData}
      onClose={onClose}
      onSave={onSave}
      serverId={serverId}
    />
  );
}

function ButtonModalContent({
  buttonData,
  onClose,
  onSave,
  serverId
}: {
  buttonData: DiscordButtonComponent;
  onClose: () => void;
  onSave: (updated: DiscordButtonComponent) => void;
  serverId?: string;
}) {
  const [label, setLabel] = useState(buttonData.label || '');
  const [style, setStyle] = useState<ButtonStyle>(buttonData.style || 1);
  const [emojiStr, setEmojiStr] = useState(() => getInitialEmojiStr(buttonData.emoji));
  const [customId, setCustomId] = useState(buttonData.custom_id || '');
  const [url, setUrl] = useState(buttonData.url || '');
  const [disabled, setDisabled] = useState(Boolean(buttonData.disabled));
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [emojiTriggerRect, setEmojiTriggerRect] = useState<DOMRect | null>(null);

  // Action Configuration State
  const initialActionType: ComponentActionType = buttonData.action?.actionType ||
    (buttonData.custom_id?.startsWith('rng_act_') ? 'ROLE' : 'NONE');

  const [actionType, setActionType] = useState<ComponentActionType>(initialActionType);
  const [roleSubtype, setRoleSubtype] = useState<RoleActionSubtype>(
    buttonData.action?.roleConfig?.subtype || 'TOGGLE'
  );
  const [roleId, setRoleId] = useState<string>(buttonData.action?.roleConfig?.roleId || '');
  const [roleSuccessMessage, setRoleSuccessMessage] = useState<string>(
    buttonData.action?.roleConfig?.successMessage || ''
  );
  const [roleRemoveMessage, setRoleRemoveMessage] = useState<string>(
    buttonData.action?.roleConfig?.removeMessage || ''
  );

  const [replyEphemeral, setReplyEphemeral] = useState<boolean>(
    buttonData.action?.replyConfig?.ephemeral ?? true
  );
  const [replyContent, setReplyContent] = useState<string>(
    buttonData.action?.replyConfig?.content || ''
  );

  const [ticketPrefix, setTicketPrefix] = useState<string>(
    buttonData.action?.ticketConfig?.channelPrefix || 'ticket-'
  );
  const [ticketWelcomeMessage, setTicketWelcomeMessage] = useState<string>(
    buttonData.action?.ticketConfig?.welcomeMessage || ''
  );

  const [dmContent, setDmContent] = useState<string>(
    buttonData.action?.dmConfig?.content || ''
  );

  // Live Server Roles Discovery
  const [roles, setRoles] = useState<GuildRoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(Boolean(serverId));

  useEffect(() => {
    let isMounted = true;
    if (!serverId) return;

    void (async () => {
      try {
        const res = await api.fetchServerRoles(serverId);
        if (isMounted && res.success && res.data) {
          setRoles(res.data);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load server roles for button customizer:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const roleOptions: DropdownOption<string>[] = useMemo(() => {
    return roles.map((r) => ({
      value: r.id,
      label: `@${r.name}`,
      badge: !r.assignableByBot ? 'Higher than Bot' : undefined,
      disabled: !r.assignableByBot,
      icon: (
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: r.color && r.color !== '#000000' ? r.color : '#99aab5',
            display: 'inline-block',
            marginRight: 6
          }}
        />
      )
    }));
  }, [roles]);

  const handleOpenEmojiPicker = (e: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiTriggerRect(e.currentTarget.getBoundingClientRect());
    setIsEmojiPickerOpen(true);
  };

  const handleEmojiSelect = (emoji: EmojiItem, insertString: string) => {
    setEmojiStr(insertString);
    setIsEmojiPickerOpen(false);
  };

  const handleSave = () => {
    let parsedEmoji: string | PartialEmojiObject | undefined = undefined;
    if (emojiStr.trim()) {
      const match = emojiStr.trim().match(/<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/);
      if (match) {
        parsedEmoji = {
          animated: match[1] === 'a',
          name: match[2],
          id: match[3]
        };
      } else {
        parsedEmoji = emojiStr.trim();
      }
    }

    let finalCustomId: string | undefined = undefined;
    let finalUrl: string | undefined = undefined;
    let actionPayload: ComponentActionPayload | undefined = undefined;

    if (style === 5) {
      finalUrl = url.trim() || 'https://discord.com';
    } else if (actionType === 'NONE') {
      finalCustomId = customId.trim() || `btn_${Date.now()}`;
    } else {
      const existingActionId = buttonData.action?.actionId ||
        (buttonData.custom_id?.startsWith('rng_act_') ? buttonData.custom_id : undefined);
      const actionId = existingActionId || `rng_act_${Date.now().toString(16)}${Math.random().toString(16).substring(2, 6)}`;
      finalCustomId = actionId;

      const selectedRole = roles.find((r) => r.id === roleId);

      actionPayload = {
        actionId,
        name: `${label.trim() || 'Button'} - ${actionType}`,
        actionType,
        roleConfig: actionType === 'ROLE' ? {
          subtype: roleSubtype,
          roleId,
          roleName: selectedRole?.name,
          successMessage: roleSuccessMessage.trim() || undefined,
          removeMessage: roleRemoveMessage.trim() || undefined
        } : undefined,
        replyConfig: actionType === 'REPLY' ? {
          ephemeral: replyEphemeral,
          content: replyContent.trim() || 'Interaction acknowledged.'
        } : undefined,
        ticketConfig: actionType === 'TICKET' ? {
          channelPrefix: ticketPrefix.trim() || 'ticket-',
          supportRoleIds: [],
          welcomeMessage: ticketWelcomeMessage.trim() || undefined
        } : undefined,
        dmConfig: actionType === 'DM' ? {
          content: dmContent.trim() || 'Notification from server bot.'
        } : undefined
      };

      // Asynchronously persist to backend registry
      api.saveServerAction(actionPayload, undefined, serverId).catch((err) => {
        console.warn('Failed to save button server action:', err);
      });
    }

    const updated: DiscordButtonComponent = {
      type: 2,
      id: buttonData.id,
      label: label.trim(),
      style,
      emoji: parsedEmoji,
      disabled,
      custom_id: finalCustomId,
      url: finalUrl,
      action: actionPayload
    };

    onSave(updated);
    onClose();
  };

  return (
    <>
      <div
        className="modal-overlay open"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-dialog"
          style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(88, 101, 242, 0.12)'
          }}
        >
          <div className="modal-header">
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(88, 101, 242, 0.15)', border: '1px solid rgba(88, 101, 242, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-gamepad" style={{ color: '#a5b4fc', fontSize: '14px' }} />
              </div>
              <span>Button Settings</span>
              <span className="component-modal-badge blurple">Type 2 • Button</span>
            </div>
            <button className="btn-container-close" onClick={onClose} type="button">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
            <div className="form-group">
              <label className="form-label">Button Label / Text</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Click Me / Accept / View"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Button Style (Discord Specification)</label>
              <div className="btn-style-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-1 ${style === 1 ? 'active' : ''}`}
                  onClick={() => setStyle(1)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 1 ? '#5865F2' : 'rgba(88, 101, 242, 0.15)',
                    border: style === 1 ? '1px solid #7983f5' : '1px solid rgba(88, 101, 242, 0.3)',
                    color: style === 1 ? '#fff' : '#a5b4fc',
                    boxShadow: style === 1 ? '0 0 14px rgba(88, 101, 242, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Primary
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-2 ${style === 2 ? 'active' : ''}`}
                  onClick={() => setStyle(2)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 2 ? '#4e5058' : 'rgba(255, 255, 255, 0.08)',
                    border: style === 2 ? '1px solid #6d6f78' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    boxShadow: style === 2 ? '0 0 14px rgba(78, 80, 88, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Secondary
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-3 ${style === 3 ? 'active' : ''}`}
                  onClick={() => setStyle(3)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 3 ? '#23a55a' : 'rgba(35, 165, 90, 0.15)',
                    border: style === 3 ? '1px solid #2dc76d' : '1px solid rgba(35, 165, 90, 0.3)',
                    color: style === 3 ? '#fff' : '#4ade80',
                    boxShadow: style === 3 ? '0 0 14px rgba(35, 165, 90, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Success
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-4 ${style === 4 ? 'active' : ''}`}
                  onClick={() => setStyle(4)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 4 ? '#da373c' : 'rgba(218, 55, 60, 0.15)',
                    border: style === 4 ? '1px solid #f23f43' : '1px solid rgba(218, 55, 60, 0.3)',
                    color: style === 4 ? '#fff' : '#f87171',
                    boxShadow: style === 4 ? '0 0 14px rgba(218, 55, 60, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Danger
                </button>
                <button
                  type="button"
                  className={`btn-style-chip btn-style-5 ${style === 5 ? 'active' : ''}`}
                  onClick={() => setStyle(5)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: style === 5 ? '#4e5058' : 'rgba(255, 255, 255, 0.08)',
                    border: style === 5 ? '1px solid #6d6f78' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    boxShadow: style === 5 ? '0 0 14px rgba(78, 80, 88, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }} />
                  <span>Link</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Emoji (Unicode or Discord Bot)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100px', textAlign: 'center', fontSize: '15px' }}
                  placeholder="✨"
                  value={emojiStr}
                  onChange={(e) => setEmojiStr(e.target.value)}
                />
                <button
                  type="button"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={handleOpenEmojiPicker}
                >
                  <i className="fa-regular fa-face-smile" /> Pick Discord Emoji
                </button>
                <div className="quick-emojis-list" style={{ display: 'flex', gap: '4px' }}>
                  {['😃', '🚀', '⚡', '🔥'].map((emo) => (
                    <span
                      key={emo}
                      className="quick-emoji-chip"
                      onClick={() => setEmojiStr(emo)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {emo}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Link URL vs Interactive Action Engine */}
            {style === 5 ? (
              <div className="form-group">
                <label className="form-label">Target URL (Link Button)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://discord.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <div style={{ fontSize: '11px', color: '#949ba4', marginTop: '6px' }}>
                  Link buttons open external websites directly and do not dispatch bot interaction events.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
                {/* Action Mode Selector */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Button Action Handler</label>
                    <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 600 }}>Action Engine</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
                    {[
                      { type: 'NONE', label: 'Custom ID', icon: 'fa-tag' },
                      { type: 'ROLE', label: 'Role Assign', icon: 'fa-shield-halved' },
                      { type: 'REPLY', label: 'Bot Reply', icon: 'fa-comment-dots' },
                      { type: 'TICKET', label: 'Ticket', icon: 'fa-ticket' },
                      { type: 'DM', label: 'Direct Msg', icon: 'fa-envelope' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setActionType(item.type as ComponentActionType)}
                        style={{
                          padding: '7px 6px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          background: actionType === item.type ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: actionType === item.type ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: actionType === item.type ? '#38bdf8' : '#dbdee1',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className={`fa-solid ${item.icon}`} style={{ fontSize: '10px' }} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-form: NONE (Raw Custom ID) */}
                {actionType === 'NONE' && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Custom ID</span>
                      <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: 400 }}>Event Handler ID</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                      placeholder="e.g. verify_member_btn"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                    />
                  </div>
                )}

                {/* Sub-form: ROLE (Role Assignment) */}
                {actionType === 'ROLE' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <label className="form-label" style={{ margin: 0, flex: 1 }}>Role Operation Subtype</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['TOGGLE', 'ADD', 'REMOVE'] as RoleActionSubtype[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setRoleSubtype(st)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: roleSubtype === st ? '#5865F2' : 'rgba(255, 255, 255, 0.06)',
                              border: roleSubtype === st ? '1px solid #7983f5' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: roleSubtype === st ? '#fff' : '#949ba4'
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Target Role</label>
                      {roleOptions.length > 0 ? (
                        <GlassmorphicDropdown
                          options={roleOptions}
                          value={roleId}
                          onChange={(val) => setRoleId(val)}
                          placeholder="Select Discord Role..."
                          searchable
                          searchPlaceholder="Search roles..."
                        />
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          placeholder={isLoadingRoles ? "Loading roles..." : "Enter Role Snowflake ID (e.g. 104712345678901234)"}
                          value={roleId}
                          onChange={(e) => setRoleId(e.target.value)}
                        />
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '11px' }}>Success Message</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '11.5px' }}
                          placeholder="Granted role successfully!"
                          value={roleSuccessMessage}
                          onChange={(e) => setRoleSuccessMessage(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11px' }}>Remove Message</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '11.5px' }}
                          placeholder="Removed role successfully!"
                          value={roleRemoveMessage}
                          onChange={(e) => setRoleRemoveMessage(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: REPLY (Ephemeral / Public Bot Message) */}
                {actionType === 'REPLY' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ margin: 0 }}>Bot Response Content</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#dbdee1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={replyEphemeral}
                          onChange={(e) => setReplyEphemeral(e.target.checked)}
                          style={{ accentColor: '#38bdf8' }}
                        />
                        <span>Ephemeral (Only clicker sees)</span>
                      </label>
                    </div>
                    <textarea
                      className="form-input"
                      rows={3}
                      style={{ fontSize: '12px', resize: 'vertical' }}
                      placeholder="Type markdown response message (e.g. Thanks for verifying! Welcome to the server.)"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                  </div>
                )}

                {/* Sub-form: TICKET (Support Ticket Channel Creation) */}
                {actionType === 'TICKET' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Channel Name Prefix</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ticket-"
                        value={ticketPrefix}
                        onChange={(e) => setTicketPrefix(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Welcome Message</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        style={{ fontSize: '12px', resize: 'vertical' }}
                        placeholder="Welcome {user}! Staff will be with you shortly."
                        value={ticketWelcomeMessage}
                        onChange={(e) => setTicketWelcomeMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-form: DM (Direct Message to User) */}
                {actionType === 'DM' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Direct Message Content</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        style={{ fontSize: '12px', resize: 'vertical' }}
                        placeholder="Message sent directly to the member's Discord DMs..."
                        value={dmContent}
                        onChange={(e) => setDmContent(e.target.value)}
                      />
                      <div style={{ fontSize: '11px', color: '#949ba4', marginTop: '4px' }}>
                        If the user has direct messages disabled, the bot automatically falls back to an ephemeral prompt.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer" style={{ padding: '14px 0 0 0', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#dbdee1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  style={{ accentColor: '#E11D2E', width: '15px', height: '15px' }}
                />
                <span>Disabled Button State</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-btn-save"
                  onClick={handleSave}
                >
                  <i className="fa-solid fa-check" />
                  <span>Save Button</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DiscordEmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={handleEmojiSelect}
        triggerRect={emojiTriggerRect}
      />
    </>
  );
}
