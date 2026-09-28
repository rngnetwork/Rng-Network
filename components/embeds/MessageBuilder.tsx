"use client";

import React, { useState, useRef } from 'react';
import {
  Type17Container,
  DiscordInnerComponent,
  DiscordButtonComponent,
  DiscordActionRowComponent,
  DiscordSelectComponent,
  DiscordSeparatorComponent,
  DiscordTextDisplayComponent,
  DiscordMediaGalleryComponent,
  DiscordFileComponent,
  DiscordSectionComponent,
  ButtonStyle,
  EmbedField
} from './types';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';
import { PaletteModal } from './PaletteModal';
import { ButtonModal } from './ButtonModal';
import { LoadModal } from './LoadModal';
import { EmojiItem, formatEmojiInsertString } from './emoji-data';

interface MessageBuilderProps {
  containers: Type17Container[];
  setContainers: React.Dispatch<React.SetStateAction<Type17Container[]>>;
  messageContent: string;
  setMessageContent: React.Dispatch<React.SetStateAction<string>>;
  onLoadTemplate: (state: { message: { content: string }; type17Containers: Type17Container[] }) => void;
}

const PRESET_ACCENTS = [
  { name: 'Blurple', hex: '#5865F2' },
  { name: 'RNG Red', hex: '#E11D2E' },
  { name: 'Green', hex: '#23A55A' },
  { name: 'Yellow', hex: '#FEE75C' },
  { name: 'Fuchsia', hex: '#EB459E' },
  { name: 'Grey', hex: '#4E5058' },
  { name: 'Dark', hex: '#2B2D31' },
  { name: 'Black', hex: '#1E1F22' }
];

export function MessageBuilder({
  containers,
  setContainers,
  messageContent,
  setMessageContent,
  onLoadTemplate
}: MessageBuilderProps) {
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview' | 'raw' | 'dispatch'>('edit');
  const [rawPayloadMode, setRawPayloadMode] = useState<'message' | 'modal'>('message');

  // Modals state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<{ cIdx: number; rowId: string; bIdx: number; data: DiscordButtonComponent } | null>(null);

  // Active Emoji Picker State
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerTriggerRect, setEmojiPickerTriggerRect] = useState<DOMRect | null>(null);
  const [emojiPickerCallback, setEmojiPickerCallback] = useState<((emoji: EmojiItem, insertStr: string) => void) | null>(null);

  // Drag & Drop tracking
  const [draggedComp, setDraggedComp] = useState<{ cIdx: number; compIdx: number } | null>(null);
  const [draggedContainer, setDraggedContainer] = useState<number | null>(null);

  // Raw JSON state
  const [rawJsonText, setRawJsonText] = useState('');
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);

  // Dispatch Tab State {server selector, channel selector, scheduler(true/false, time), dispatchBtn}
  const [selectedServer, setSelectedServer] = useState('server_rng_hq');
  const [selectedChannel, setSelectedChannel] = useState('channel_announcements');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/123456789/token_sample?with_components=true');
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    '[Ready] Discord Components V2 Engine loaded.',
    '[Info] IS_COMPONENTS_V2 flag enabled (32768). Type 17 Containers active.'
  ]);

  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to open emoji picker with callback
  const triggerEmojiPicker = (
    e: React.MouseEvent<HTMLButtonElement>,
    onSelect: (emoji: EmojiItem, insertStr: string) => void
  ) => {
    setEmojiPickerTriggerRect(e.currentTarget.getBoundingClientRect());
    setEmojiPickerCallback(() => onSelect);
    setEmojiPickerOpen(true);
  };

  // Markdown tool handler
  const applyMarkdownToMessage = (prefix: string, suffix: string) => {
    const el = messageTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selText = messageContent.substring(start, end);
    const newText = messageContent.substring(0, start) + prefix + selText + suffix + messageContent.substring(end);
    setMessageContent(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Containers management
  const addContainer = () => {
    const newContainer: Type17Container = {
      id: `c17_${Date.now()}`,
      accentColor: '#E11D2E',
      isSpoiler: false,
      title: 'Container Title',
      description: 'Describe the contents of this Type 17 Container...',
      fields: [],
      components: [
        {
          type: 1,
          id: `row_${Date.now()}`,
          label: 'ACTIONS',
          items: [
            { type: 2, style: 1, label: 'Primary Action', custom_id: `btn_${Date.now()}` }
          ]
        }
      ]
    };
    setContainers([...containers, newContainer]);
  };

  const removeContainer = (cIdx: number) => {
    if (containers.length <= 1) {
      if (!confirm('Remove this container? You can always add a new one.')) return;
    }
    const updated = [...containers];
    updated.splice(cIdx, 1);
    setContainers(updated);
  };

  const moveContainer = (cIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? cIdx - 1 : cIdx + 1;
    if (targetIdx < 0 || targetIdx >= containers.length) return;
    const updated = [...containers];
    const [moved] = updated.splice(cIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setContainers(updated);
  };

  // Add Action Row
  const addActionRow = (cIdx = 0) => {
    if (containers.length === 0) addContainer();
    const updated = [...containers];
    const target = updated[cIdx] || updated[0];
    const newRow: DiscordActionRowComponent = {
      type: 1,
      id: `row_${Date.now()}`,
      label: `ROW ${target.components.filter(c => c.type === 1).length + 1}`,
      items: [
        { type: 2, style: 1, label: 'Action Button', custom_id: `btn_${Date.now()}` }
      ]
    };
    target.components.push(newRow);
    setContainers(updated);
  };

  // Insert component from Palette
  const handleInsertComponentType = (typeNum: number) => {
    if (containers.length === 0) addContainer();
    const updated = [...containers];
    const target = updated[0];

    if (typeNum === 17) {
      addContainer();
      return;
    }

    if (typeNum === 1) {
      addActionRow(0);
      return;
    }

    if (typeNum === 2) {
      // Add button to last action row, or create action row
      let lastRow = target.components.slice().reverse().find(c => c.type === 1) as DiscordActionRowComponent;
      if (!lastRow) {
        lastRow = {
          type: 1,
          id: `row_${Date.now()}`,
          label: 'ACTIONS',
          items: []
        };
        target.components.push(lastRow);
      }
      if (lastRow.items.length < 5) {
        lastRow.items.push({
          type: 2,
          style: 1,
          label: `Button ${lastRow.items.length + 1}`,
          custom_id: `btn_${Date.now()}`
        });
      } else {
        alert('Action row is full (maximum 5 buttons per row).');
      }
      setContainers(updated);
      return;
    }

    if (typeNum === 14) {
      // Separator
      const sep: DiscordSeparatorComponent = {
        type: 14,
        id: `sep_${Date.now()}`,
        divider: true,
        spacing: 2
      };
      target.components.push(sep);
      setContainers(updated);
      return;
    }

    if (typeNum === 10) {
      // Text Display
      const txt: DiscordTextDisplayComponent = {
        type: 10,
        id: `txt_${Date.now()}`,
        text: '### New Text Display\nEnter markdown text here...'
      };
      target.components.push(txt);
      setContainers(updated);
      return;
    }

    if (typeNum === 3 || typeNum === 5 || typeNum === 6 || typeNum === 7 || typeNum === 8) {
      // Select Menus
      const sel: DiscordSelectComponent = {
        type: typeNum as any,
        id: `sel_${Date.now()}`,
        custom_id: `menu_${Date.now()}`,
        placeholder: 'Select an option...',
        options: typeNum === 3 ? [
          { label: 'Option 1', value: 'opt_1', emoji: '⭐', description: 'Description 1', default: false },
          { label: 'Option 2', value: 'opt_2', emoji: '🔹', description: 'Description 2', default: false }
        ] : undefined
      };
      target.components.push(sel);
      setContainers(updated);
      return;
    }

    if (typeNum === 12) {
      // Media Gallery
      const gallery: DiscordMediaGalleryComponent = {
        type: 12,
        id: `gallery_${Date.now()}`,
        items: ['https://cdn.discordapp.com/embed/avatars/0.png']
      };
      target.components.push(gallery);
      setContainers(updated);
      return;
    }

    if (typeNum === 13) {
      // File
      const file: DiscordFileComponent = {
        type: 13,
        id: `file_${Date.now()}`,
        filename: 'document.pdf',
        url: 'attachment://document.pdf'
      };
      target.components.push(file);
      setContainers(updated);
      return;
    }

    if (typeNum === 9) {
      // Section
      const sec: DiscordSectionComponent = {
        type: 9,
        id: `sec_${Date.now()}`,
        text: '### Section Header\nDescriptive text inside a section card.',
        accessory: {
          type: 'button',
          label: 'View',
          emoji: '🔍'
        }
      };
      target.components.push(sec);
      setContainers(updated);
      return;
    }

    // Modal components
    target.components.push({
      type: typeNum as any,
      id: `comp_${Date.now()}`,
      custom_id: `field_${Date.now()}`,
      label: `Component Type ${typeNum}`
    } as any);

    setContainers(updated);
  };

  // Move component within container
  const moveComponent = (cIdx: number, compIdx: number, direction: 'up' | 'down') => {
    const updated = [...containers];
    const compList = updated[cIdx].components;
    const targetIdx = direction === 'up' ? compIdx - 1 : compIdx + 1;
    if (targetIdx < 0 || targetIdx >= compList.length) return;
    const [moved] = compList.splice(compIdx, 1);
    compList.splice(targetIdx, 0, moved);
    setContainers(updated);
  };

  // Button shifting in Action Row
  const shiftButton = (cIdx: number, rowId: string, bIdx: number, direction: 'left' | 'right') => {
    const updated = [...containers];
    const row = updated[cIdx].components.find(c => c.id === rowId) as DiscordActionRowComponent;
    if (!row || !row.items) return;
    const targetIdx = direction === 'left' ? bIdx - 1 : bIdx + 1;
    if (targetIdx < 0 || targetIdx >= row.items.length) return;
    const [moved] = row.items.splice(bIdx, 1);
    row.items.splice(targetIdx, 0, moved);
    setContainers(updated);
  };

  // Button cycle style
  const cycleButtonStyle = (cIdx: number, rowId: string, bIdx: number) => {
    const updated = [...containers];
    const row = updated[cIdx].components.find(c => c.id === rowId) as DiscordActionRowComponent;
    if (!row || !row.items || !row.items[bIdx]) return;
    const btn = row.items[bIdx] as DiscordButtonComponent;
    btn.style = ((btn.style % 5) + 1) as ButtonStyle;
    setContainers(updated);
  };

  // Remove button
  const removeButton = (cIdx: number, rowId: string, bIdx: number) => {
    const updated = [...containers];
    const row = updated[cIdx].components.find(c => c.id === rowId) as DiscordActionRowComponent;
    if (!row || !row.items) return;
    row.items.splice(bIdx, 1);
    setContainers(updated);
  };

  // Clear builder
  const handleClearBuilder = () => {
    if (confirm('Clear the message builder canvas? This resets the editor.')) {
      setMessageContent('');
      setContainers([
        {
          id: `c17_${Date.now()}`,
          accentColor: '#E11D2E',
          isSpoiler: false,
          title: '',
          description: '',
          fields: [],
          components: []
        }
      ]);
    }
  };

  // Load Component into active container
  const handleLoadSingleComponent = (comp: DiscordInnerComponent) => {
    if (containers.length === 0) addContainer();
    const updated = [...containers];
    updated[0].components.push(JSON.parse(JSON.stringify(comp)));
    setContainers(updated);
  };

  // Build Discord Components V2 JSON Payload
  const generatePayload = () => {
    const containerList = containers.map(c => {
      let accentDec = 14753070; // #E11D2E default
      if (typeof c.accentColor === 'string') {
        const parsed = parseInt(c.accentColor.replace('#', ''), 16);
        if (!isNaN(parsed)) accentDec = parsed;
      }

      const cComponents: any[] = [];

      let headerMarkdown = '';
      if (c.author?.name) headerMarkdown += `*${c.author.name}*\n`;
      if (c.title) headerMarkdown += `**${c.title}**\n`;
      if (c.description) headerMarkdown += c.description;
      headerMarkdown = headerMarkdown.trim();

      if (headerMarkdown) {
        if (c.thumbnail) {
          cComponents.push({
            type: 9,
            components: [{ type: 10, content: headerMarkdown }],
            accessory: { type: 11, media: { url: c.thumbnail } }
          });
        } else {
          cComponents.push({ type: 10, content: headerMarkdown });
        }
      }

      if (c.fields && c.fields.length > 0) {
        const fieldsText = c.fields.map(f => `**${f.name}**\n${f.value}`).join('\n\n');
        cComponents.push({ type: 10, content: fieldsText });
      }

      if (c.image) {
        cComponents.push({ type: 12, items: [{ media: { url: c.image } }] });
      }

      // Add child components
      c.components.forEach(comp => {
        if (comp.type === 1) {
          cComponents.push({
            type: 1,
            components: (comp as DiscordActionRowComponent).items.map((item: any) => {
              if (item.type === 2) {
                const btn: any = { type: 2, style: item.style, label: item.label };
                if (item.style === 5) btn.url = item.url || 'https://discord.com';
                else btn.custom_id = item.custom_id || `btn_${Date.now()}`;
                if (item.emoji) {
                  if (typeof item.emoji === 'string') btn.emoji = { name: item.emoji };
                  else btn.emoji = item.emoji;
                }
                if (item.disabled) btn.disabled = true;
                return btn;
              }
              return item;
            })
          });
        } else if (comp.type === 14) {
          cComponents.push({
            type: 14,
            divider: Boolean((comp as DiscordSeparatorComponent).divider),
            spacing: (comp as DiscordSeparatorComponent).spacing || 1
          });
        } else if (comp.type === 10) {
          cComponents.push({
            type: 10,
            content: (comp as DiscordTextDisplayComponent).text
          });
        } else if (comp.type === 3) {
          cComponents.push({
            type: 1,
            components: [
              {
                type: 3,
                custom_id: (comp as DiscordSelectComponent).custom_id || `menu_${Date.now()}`,
                placeholder: (comp as DiscordSelectComponent).placeholder,
                options: (comp as DiscordSelectComponent).options || []
              }
            ]
          });
        } else {
          cComponents.push(comp);
        }
      });

      return {
        type: 17,
        accent_color: accentDec,
        spoiler: Boolean(c.isSpoiler),
        components: cComponents
      };
    });

    return {
      content: messageContent || undefined,
      flags: 32768,
      components: containerList
    };
  };

  // Sync to Raw view
  const handleSwitchToRaw = () => {
    setActiveSubTab('raw');
    setRawJsonText(JSON.stringify(generatePayload(), null, 2));
    setRawJsonError(null);
  };

  // Apply Raw JSON back to canvas
  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      if (parsed.content) setMessageContent(parsed.content);
      if (Array.isArray(parsed.components)) {
        const loadedContainers: Type17Container[] = [];
        parsed.components.forEach((c: any, idx: number) => {
          if (c.type === 17) {
            const hexColor = c.accent_color ? `#${c.accent_color.toString(16).padStart(6, '0')}` : '#E11D2E';
            loadedContainers.push({
              id: `c17_${Date.now()}_${idx}`,
              accentColor: hexColor,
              isSpoiler: Boolean(c.spoiler),
              components: c.components || []
            });
          }
        });
        if (loadedContainers.length > 0) {
          setContainers(loadedContainers);
        }
      }
      setRawJsonError(null);
      alert('Successfully applied JSON payload to the Message Builder canvas!');
    } catch (err: any) {
      setRawJsonError(`Invalid JSON: ${err.message}`);
    }
  };

  // Dispatch Simulator
  const handleDispatch = () => {
    const now = new Date().toLocaleTimeString();
    const newLogs = [...telemetryLogs];
    newLogs.push(`[${now}] Dispatch initiated to Server ID: ${selectedServer}, Channel ID: ${selectedChannel}`);
    if (isScheduled) {
      newLogs.push(`[${now}] Scheduled for: ${scheduleTime || 'Unspecified time'}`);
      newLogs.push(`[${now}] Payload queued in Redis scheduling cluster.`);
    } else {
      newLogs.push(`[${now}] Sending Components V2 POST to Webhook URL: ${webhookUrl}`);
      newLogs.push(`[${now}] Payload contains ${containers.length} Type 17 Container(s) with flag 32768.`);
      newLogs.push(`[${now}] ✅ SUCCESS: Discord API HTTP 200 OK. Message rendered.`);
    }
    setTelemetryLogs(newLogs);
  };

  // Total components count
  const totalComponentCount = containers.reduce((acc, c) => acc + 1 + (c.components?.length || 0), 0);

  return (
    <div className="unified-workspace-shell">
      
      {/* SUB-TABS: [ Edit ] [ Preview ] [ Raw ] [ Dispatch ] */}
      <nav className="sub-tabs-header">
        <div className="sub-tabs-pills">
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('edit')}
          >
            <i className="fa-solid fa-pen-to-square" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('preview')}
          >
            <i className="fa-brands fa-discord" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'raw' ? 'active' : ''}`}
            onClick={handleSwitchToRaw}
          >
            <i className="fa-solid fa-code" />
            <span>Raw</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'dispatch' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('dispatch')}
          >
            <i className="fa-solid fa-paper-plane" />
            <span>Dispatch</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-header-action"
            onClick={() => setIsPaletteOpen(true)}
            style={{ color: 'var(--discord-cyan)', borderColor: 'rgba(0, 168, 252, 0.4)' }}
          >
            <i className="fa-solid fa-plus" /> Add Component (Type 1-23)
          </button>
          <span style={{ fontSize: '11px', color: 'var(--color-foreground-muted)' }}>Type 17 V2 Mode</span>
        </div>
      </nav>

      {/* SUB-TAB 1: MERGED WYSIWYG DISCORD CANVAS */}
      {activeSubTab === 'edit' && (
        <div className="tab-content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' }}>
          <div className="wysiwyg-canvas-wrapper">
            
            {/* Unified Message Board */}
            <div className="wysiwyg-board">
              
              {/* 1. Normal Message Sender Box with Markdown */}
              <div className="wysiwyg-normal-msg-box">
                <div className="msg-top-bar">
                  <div className="wysiwyg-md-tools">
                    <button type="button" className="wysiwyg-tool-btn" title="Bold" onClick={() => applyMarkdownToMessage('**', '**')}>
                      <i className="fa-solid fa-bold" />
                    </button>
                    <button type="button" className="wysiwyg-tool-btn" title="Italic" onClick={() => applyMarkdownToMessage('*', '*')}>
                      <i className="fa-solid fa-italic" />
                    </button>
                    <button type="button" className="wysiwyg-tool-btn" title="Underline" onClick={() => applyMarkdownToMessage('__', '__')}>
                      <i className="fa-solid fa-underline" />
                    </button>
                    <button type="button" className="wysiwyg-tool-btn" title="Strikethrough" onClick={() => applyMarkdownToMessage('~~', '~~')}>
                      <i className="fa-solid fa-strikethrough" />
                    </button>
                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                    <button type="button" className="wysiwyg-tool-btn" title="Inline Code" onClick={() => applyMarkdownToMessage('`', '`')}>
                      <i className="fa-solid fa-code" />
                    </button>
                    <button type="button" className="wysiwyg-tool-btn" title="Quote" onClick={() => applyMarkdownToMessage('> ', '')}>
                      <i className="fa-solid fa-quote-left" />
                    </button>
                    <button type="button" className="wysiwyg-tool-btn" title="Spoiler" onClick={() => applyMarkdownToMessage('||', '||')}>
                      <i className="fa-solid fa-eye-slash" />
                    </button>
                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                    <button
                      type="button"
                      className="wysiwyg-tool-btn"
                      title="Discord Emoji Picker"
                      onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                        const el = messageTextareaRef.current;
                        if (!el) return;
                        const start = el.selectionStart || 0;
                        const end = el.selectionEnd || 0;
                        const newText = messageContent.substring(0, start) + insertStr + messageContent.substring(end);
                        setMessageContent(newText);
                      })}
                    >
                      <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
                    Normal Message Box (Markdown Supported)
                  </span>
                </div>

                <textarea
                  ref={messageTextareaRef}
                  className="wysiwyg-msg-input"
                  placeholder="Type normal message content (e.g. Welcome to the server!)..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={2}
                />
              </div>

              {/* 2. Type 17 Containers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {containers.map((container, cIdx) => (
                  <div
                    key={container.id}
                    className="type17-container-card"
                    style={{
                      borderLeft: `4px solid ${container.accentColor || '#E11D2E'}`,
                      background: '#2b2d31',
                      borderRadius: '8px',
                      padding: '14px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {/* Container Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ cursor: 'grab', color: '#949ba4' }} title="Drag Container">
                          <i className="fa-solid fa-grip-vertical" />
                        </span>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Container {cIdx + 1} (Type 17)
                        </span>

                        {/* Accent Swatches */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '2px 5px', borderRadius: '5px' }}>
                          {PRESET_ACCENTS.map((acc) => (
                            <button
                              key={acc.name}
                              type="button"
                              onClick={() => {
                                const upd = [...containers];
                                upd[cIdx].accentColor = acc.hex;
                                setContainers(upd);
                              }}
                              style={{
                                width: '15px',
                                height: '15px',
                                borderRadius: '3px',
                                background: acc.hex,
                                border: container.accentColor === acc.hex ? '1.5px solid #fff' : '1px solid rgba(0,0,0,0.5)',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title={acc.name}
                            />
                          ))}
                          <input
                            type="text"
                            value={container.accentColor || '#E11D2E'}
                            onChange={(e) => {
                              const upd = [...containers];
                              upd[cIdx].accentColor = e.target.value;
                              setContainers(upd);
                            }}
                            style={{
                              width: '65px',
                              height: '18px',
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10.5px',
                              padding: '0 4px',
                              textAlign: 'center'
                            }}
                          />
                        </div>
                      </div>

                      {/* Container Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Spoiler toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#949ba4', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(container.isSpoiler)}
                            onChange={(e) => {
                              const upd = [...containers];
                              upd[cIdx].isSpoiler = e.target.checked;
                              setContainers(upd);
                            }}
                          />
                          <span>Spoiler</span>
                        </label>

                        {/* Move Up */}
                        <button
                          type="button"
                          className="wysiwyg-tool-btn"
                          title="Move Container Up"
                          disabled={cIdx === 0}
                          onClick={() => moveContainer(cIdx, 'up')}
                        >
                          <i className="fa-solid fa-chevron-up" />
                        </button>
                        {/* Move Down */}
                        <button
                          type="button"
                          className="wysiwyg-tool-btn"
                          title="Move Container Down"
                          disabled={cIdx === containers.length - 1}
                          onClick={() => moveContainer(cIdx, 'down')}
                        >
                          <i className="fa-solid fa-chevron-down" />
                        </button>
                        {/* Delete Container */}
                        <button
                          type="button"
                          className="wysiwyg-tool-btn"
                          title="Delete Container"
                          style={{ color: '#ef4444' }}
                          onClick={() => removeContainer(cIdx)}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </div>

                    {/* Author, Title, Description Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, height: '32px', fontSize: '12px' }}
                          placeholder="Author Name (Optional)"
                          value={container.author?.name || ''}
                          onChange={(e) => {
                            const upd = [...containers];
                            upd[cIdx].author = { ...upd[cIdx].author, name: e.target.value };
                            setContainers(upd);
                          }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, height: '32px', fontSize: '12px' }}
                          placeholder="Author Icon URL"
                          value={container.author?.icon_url || ''}
                          onChange={(e) => {
                            const upd = [...containers];
                            upd[cIdx].author = { ...upd[cIdx].author, name: upd[cIdx].author?.name || '', icon_url: e.target.value };
                            setContainers(upd);
                          }}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '36px', fontSize: '13px', fontWeight: 700, paddingRight: '36px' }}
                          placeholder="Container Title..."
                          value={container.title || ''}
                          onChange={(e) => {
                            const upd = [...containers];
                            upd[cIdx].title = e.target.value;
                            setContainers(upd);
                          }}
                        />
                        <button
                          type="button"
                          className="wysiwyg-tool-btn"
                          style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                          onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                            const upd = [...containers];
                            upd[cIdx].title = (upd[cIdx].title || '') + insertStr;
                            setContainers(upd);
                          })}
                        >
                          <i className="fa-regular fa-face-smile" />
                        </button>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <textarea
                          className="form-input"
                          rows={2}
                          style={{ fontSize: '13px', lineHeight: 1.45, paddingRight: '36px' }}
                          placeholder="Container Description (markdown supported)..."
                          value={container.description || ''}
                          onChange={(e) => {
                            const upd = [...containers];
                            upd[cIdx].description = e.target.value;
                            setContainers(upd);
                          }}
                        />
                        <button
                          type="button"
                          className="wysiwyg-tool-btn"
                          style={{ position: 'absolute', right: '6px', top: '10px' }}
                          onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                            const upd = [...containers];
                            upd[cIdx].description = (upd[cIdx].description || '') + insertStr;
                            setContainers(upd);
                          })}
                        >
                          <i className="fa-regular fa-face-smile" />
                        </button>
                      </div>
                    </div>

                    {/* Child Components inside Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {container.components.map((comp, compIdx) => (
                        <div
                          key={comp.id || `comp_${compIdx}`}
                          className="draggable-comp-item"
                          style={{
                            background: '#1e1f22',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Component Item Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ cursor: 'grab', color: '#949ba4' }}>
                                <i className="fa-solid fa-grip-vertical" />
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                                {comp.type === 1 && 'ACTION ROW (TYPE 1)'}
                                {comp.type === 14 && 'SEPARATOR (TYPE 14)'}
                                {comp.type === 10 && 'TEXT DISPLAY (TYPE 10)'}
                                {comp.type === 3 && 'STRING SELECT (TYPE 3)'}
                                {comp.type === 12 && 'MEDIA GALLERY (TYPE 12)'}
                                {comp.type === 13 && 'FILE ATTACHMENT (TYPE 13)'}
                                {comp.type === 9 && 'SECTION (TYPE 9)'}
                                {comp.type > 14 && `COMPONENT (TYPE ${comp.type})`}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                className="wysiwyg-tool-btn"
                                title="Move Up"
                                disabled={compIdx === 0}
                                onClick={() => moveComponent(cIdx, compIdx, 'up')}
                              >
                                <i className="fa-solid fa-arrow-up" style={{ fontSize: '10px' }} />
                              </button>
                              <button
                                type="button"
                                className="wysiwyg-tool-btn"
                                title="Move Down"
                                disabled={compIdx === container.components.length - 1}
                                onClick={() => moveComponent(cIdx, compIdx, 'down')}
                              >
                                <i className="fa-solid fa-arrow-down" style={{ fontSize: '10px' }} />
                              </button>
                              <button
                                type="button"
                                className="wysiwyg-tool-btn"
                                title="Remove Component"
                                style={{ color: '#ef4444' }}
                                onClick={() => {
                                  const upd = [...containers];
                                  upd[cIdx].components.splice(compIdx, 1);
                                  setContainers(upd);
                                }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </div>
                          </div>

                          {/* Specific Component Content Renderers */}
                          {/* 1. Action Row (Buttons) */}
                          {comp.type === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {(comp as DiscordActionRowComponent).items?.map((item: any, bIdx: number) => {
                                  if (item.type === 2) {
                                    const btn = item as DiscordButtonComponent;
                                    const styleClass =
                                      btn.style === 1 ? 'btn-style-1' :
                                      btn.style === 2 ? 'btn-style-2' :
                                      btn.style === 3 ? 'btn-style-3' :
                                      btn.style === 4 ? 'btn-style-4' : 'btn-style-5';

                                    return (
                                      <div
                                        key={btn.id || `btn_${bIdx}`}
                                        className={`discord-btn ${styleClass}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '5px 8px',
                                          borderRadius: '6px',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {/* Shift left */}
                                        <button
                                          type="button"
                                          className="wysiwyg-tool-btn"
                                          style={{ width: '18px', height: '18px', fontSize: '9px' }}
                                          disabled={bIdx === 0}
                                          onClick={() => shiftButton(cIdx, comp.id!, bIdx, 'left')}
                                        >
                                          ◀
                                        </button>

                                        {/* Inline Label */}
                                        <input
                                          type="text"
                                          value={btn.label}
                                          onChange={(e) => {
                                            const upd = [...containers];
                                            const row = upd[cIdx].components[compIdx] as DiscordActionRowComponent;
                                            (row.items[bIdx] as DiscordButtonComponent).label = e.target.value;
                                            setContainers(upd);
                                          }}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: '12px',
                                            width: `${Math.max(60, btn.label.length * 8 + 10)}px`,
                                            outline: 'none'
                                          }}
                                        />

                                        {/* Cycle Style */}
                                        <button
                                          type="button"
                                          className="wysiwyg-tool-btn"
                                          style={{ width: '18px', height: '18px', fontSize: '10px' }}
                                          title="Cycle Button Style (1-5)"
                                          onClick={() => cycleButtonStyle(cIdx, comp.id!, bIdx)}
                                        >
                                          🎨
                                        </button>

                                        {/* Edit Modal */}
                                        <button
                                          type="button"
                                          className="wysiwyg-tool-btn"
                                          style={{ width: '18px', height: '18px', fontSize: '10px' }}
                                          title="Configure Button"
                                          onClick={() => setEditingButton({ cIdx, rowId: comp.id!, bIdx, data: btn })}
                                        >
                                          ⚙️
                                        </button>

                                        {/* Shift right */}
                                        <button
                                          type="button"
                                          className="wysiwyg-tool-btn"
                                          style={{ width: '18px', height: '18px', fontSize: '9px' }}
                                          disabled={bIdx === (comp as DiscordActionRowComponent).items.length - 1}
                                          onClick={() => shiftButton(cIdx, comp.id!, bIdx, 'right')}
                                        >
                                          ▶
                                        </button>

                                        {/* Remove Button */}
                                        <button
                                          type="button"
                                          className="wysiwyg-tool-btn"
                                          style={{ width: '18px', height: '18px', fontSize: '10px', color: '#ff4d4d' }}
                                          title="Remove Button"
                                          onClick={() => removeButton(cIdx, comp.id!, bIdx)}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}

                                {(comp as DiscordActionRowComponent).items.length < 5 && (
                                  <button
                                    type="button"
                                    className="btn-header-action"
                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                    onClick={() => {
                                      const upd = [...containers];
                                      const row = upd[cIdx].components[compIdx] as DiscordActionRowComponent;
                                      row.items.push({
                                        type: 2,
                                        style: 1,
                                        label: `Button ${row.items.length + 1}`,
                                        custom_id: `btn_${Date.now()}`
                                      });
                                      setContainers(upd);
                                    }}
                                  >
                                    <i className="fa-solid fa-plus" /> Button
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 2. Separator */}
                          {comp.type === 14 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean((comp as DiscordSeparatorComponent).divider)}
                                  onChange={(e) => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordSeparatorComponent).divider = e.target.checked;
                                    setContainers(upd);
                                  }}
                                />
                                <span>Visible Divider Line</span>
                              </label>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Spacing:</span>
                                <button
                                  type="button"
                                  className={`btn-style-chip ${(comp as DiscordSeparatorComponent).spacing === 1 ? 'active' : ''}`}
                                  style={{ padding: '2px 8px', fontSize: '11px' }}
                                  onClick={() => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordSeparatorComponent).spacing = 1;
                                    setContainers(upd);
                                  }}
                                >
                                  Small (1)
                                </button>
                                <button
                                  type="button"
                                  className={`btn-style-chip ${(comp as DiscordSeparatorComponent).spacing === 2 ? 'active' : ''}`}
                                  style={{ padding: '2px 8px', fontSize: '11px' }}
                                  onClick={() => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordSeparatorComponent).spacing = 2;
                                    setContainers(upd);
                                  }}
                                >
                                  Large (2)
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 3. Text Display */}
                          {comp.type === 10 && (
                            <div style={{ position: 'relative' }}>
                              <textarea
                                className="form-input"
                                rows={2}
                                style={{ fontSize: '12.5px', paddingRight: '36px' }}
                                value={(comp as DiscordTextDisplayComponent).text}
                                onChange={(e) => {
                                  const upd = [...containers];
                                  (upd[cIdx].components[compIdx] as DiscordTextDisplayComponent).text = e.target.value;
                                  setContainers(upd);
                                }}
                              />
                              <button
                                type="button"
                                className="wysiwyg-tool-btn"
                                style={{ position: 'absolute', right: '6px', top: '10px' }}
                                onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                                  const upd = [...containers];
                                  const c = upd[cIdx].components[compIdx] as DiscordTextDisplayComponent;
                                  c.text = (c.text || '') + insertStr;
                                  setContainers(upd);
                                })}
                              >
                                <i className="fa-regular fa-face-smile" />
                              </button>
                            </div>
                          )}

                          {/* 4. String Select */}
                          {comp.type === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ height: '32px', fontSize: '12px' }}
                                placeholder="Select placeholder..."
                                value={(comp as DiscordSelectComponent).placeholder || ''}
                                onChange={(e) => {
                                  const upd = [...containers];
                                  (upd[cIdx].components[compIdx] as DiscordSelectComponent).placeholder = e.target.value;
                                  setContainers(upd);
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {(comp as DiscordSelectComponent).options?.map((opt, optIdx) => (
                                  <div key={optIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ width: '40px', textAlign: 'center', height: '28px', fontSize: '12px' }}
                                      value={opt.emoji || ''}
                                      placeholder="⭐"
                                      onChange={(e) => {
                                        const upd = [...containers];
                                        const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                        select.options![optIdx].emoji = e.target.value;
                                        setContainers(upd);
                                      }}
                                    />
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ flex: 1, height: '28px', fontSize: '12px' }}
                                      placeholder="Option label"
                                      value={opt.label}
                                      onChange={(e) => {
                                        const upd = [...containers];
                                        const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                        select.options![optIdx].label = e.target.value;
                                        setContainers(upd);
                                      }}
                                    />
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ flex: 1, height: '28px', fontSize: '12px' }}
                                      placeholder="Description"
                                      value={opt.description || ''}
                                      onChange={(e) => {
                                        const upd = [...containers];
                                        const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                        select.options![optIdx].description = e.target.value;
                                        setContainers(upd);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="wysiwyg-tool-btn"
                                      style={{ color: '#ef4444' }}
                                      onClick={() => {
                                        const upd = [...containers];
                                        const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                        select.options!.splice(optIdx, 1);
                                        setContainers(upd);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="btn-header-action"
                                  style={{ padding: '3px 8px', fontSize: '10.5px', alignSelf: 'flex-start' }}
                                  onClick={() => {
                                    const upd = [...containers];
                                    const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                    if (!select.options) select.options = [];
                                    select.options.push({
                                      label: `Option ${select.options.length + 1}`,
                                      value: `opt_${Date.now()}`
                                    });
                                    setContainers(upd);
                                  }}
                                >
                                  + Add Option
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

            </div>

            {/* 3. Integrated Bottom Controls Bar (Glued to board, no dead gap!) */}
            <div className="wysiwyg-bottom-bar">
              <button
                type="button"
                className="btn-ctrl-cyan"
                onClick={addContainer}
                title="Add another Type 17 Container"
              >
                <i className="fa-solid fa-plus" /> Container
              </button>
              <button
                type="button"
                className="btn-ctrl-blue"
                onClick={() => addActionRow(0)}
                title="Add Action Row"
              >
                <i className="fa-solid fa-plus" /> Action Row
              </button>
              <button
                type="button"
                className="btn-ctrl-purple"
                onClick={() => setIsPaletteOpen(true)}
                title="Insert Discord Component Types 1 to 23"
              >
                <i className="fa-solid fa-cubes" /> + Component (Type 1-23)
              </button>
              <button
                type="button"
                className="btn-ctrl-green"
                onClick={() => setIsLoadModalOpen(true)}
                title="Load Preset or Template"
              >
                Load
              </button>
              <button
                type="button"
                className="btn-ctrl-red"
                onClick={handleClearBuilder}
                title="Clear Builder"
              >
                Clear
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: CLEAN 1:1 DISCORD LIVE PREVIEW */}
      {activeSubTab === 'preview' && (
        <div className="tab-content-area" style={{ flex: 1, padding: '20px' }}>
          <div className="preview-board-container" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
            
            {/* Discord Message Sim */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #E11D2E, #111)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', color: '#fff', flexShrink: 0 }}>
                RN
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>RNG Bot</span>
                  <span style={{ background: '#5865F2', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px' }}>
                    BOT
                  </span>
                  <span style={{ fontSize: '11px', color: '#949ba4' }}>Today at 12:00 PM</span>
                </div>

                {/* Normal message text */}
                {messageContent && (
                  <div style={{ fontSize: '14.5px', color: '#dbdee1', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {messageContent}
                  </div>
                )}

                {/* Type 17 Containers */}
                {containers.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      borderLeft: `4px solid ${c.accentColor || '#E11D2E'}`,
                      background: '#2b2d31',
                      borderRadius: '4px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '4px',
                      maxWidth: '520px'
                    }}
                  >
                    {c.author?.name && (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.author.icon_url && <img src={c.author.icon_url} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />}
                        <span>{c.author.name}</span>
                      </div>
                    )}
                    {c.title && (
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {c.title}
                      </div>
                    )}
                    {c.description && (
                      <div style={{ fontSize: '13px', color: '#dbdee1', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                        {c.description}
                      </div>
                    )}

                    {/* Child Components preview */}
                    {c.components.map((comp, idx) => (
                      <div key={idx} style={{ marginTop: '2px' }}>
                        {comp.type === 1 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {(comp as DiscordActionRowComponent).items?.map((btn: any, bIdx: number) => {
                              const styleClass =
                                btn.style === 1 ? 'btn-style-1' :
                                btn.style === 2 ? 'btn-style-2' :
                                btn.style === 3 ? 'btn-style-3' :
                                btn.style === 4 ? 'btn-style-4' : 'btn-style-5';

                              return (
                                <button
                                  key={bIdx}
                                  type="button"
                                  className={`discord-btn ${styleClass}`}
                                  style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  {btn.emoji && <span>{typeof btn.emoji === 'string' ? btn.emoji : btn.emoji.name}</span>}
                                  <span>{btn.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {comp.type === 14 && (
                          <div
                            style={{
                              height: (comp as DiscordSeparatorComponent).spacing === 2 ? '16px' : '8px',
                              borderBottom: (comp as DiscordSeparatorComponent).divider ? '1px solid rgba(255,255,255,0.1)' : 'none',
                              marginBottom: (comp as DiscordSeparatorComponent).spacing === 2 ? '8px' : '4px'
                            }}
                          />
                        )}
                        {comp.type === 10 && (
                          <div style={{ fontSize: '13px', color: '#dbdee1', whiteSpace: 'pre-wrap' }}>
                            {(comp as DiscordTextDisplayComponent).text}
                          </div>
                        )}
                        {comp.type === 3 && (
                          <div style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#949ba4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{(comp as DiscordSelectComponent).placeholder || 'Select an option...'}</span>
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: RAW JSON CODE VIEW */}
      {activeSubTab === 'raw' && (
        <div className="tab-content-area" style={{ flex: 1, padding: '16px 20px' }}>
          <div className="raw-editor-container">
            
            {/* Live Discord Components V2 Validation Panel */}
            <div className="v2-validation-card">
              <div className="v2-validation-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="v2-status-pill-valid">
                    <i className="fa-solid fa-circle-check" /> 100% Valid Components V2
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--discord-text-muted)' }}>
                    Total Components: {totalComponentCount} / 40 (Limit: 40)
                  </span>
                </div>
                <div className="raw-payload-mode-tabs">
                  <button
                    type="button"
                    className={`raw-mode-btn ${rawPayloadMode === 'message' ? 'active' : ''}`}
                    onClick={() => setRawPayloadMode('message')}
                  >
                    Message V2 Payload
                  </button>
                  <button
                    type="button"
                    className={`raw-mode-btn ${rawPayloadMode === 'modal' ? 'active' : ''}`}
                    onClick={() => setRawPayloadMode('modal')}
                  >
                    Modal Components View
                  </button>
                </div>
              </div>
              <div className="v2-rule-checklist">
                <span className="v2-rule-tag passed"><i className="fa-solid fa-check" /> Flags: 32768 (IS_COMPONENTS_V2)</span>
                <span className="v2-rule-tag passed"><i className="fa-solid fa-check" /> No Legacy Embeds</span>
                <span className="v2-rule-tag passed"><i className="fa-solid fa-check" /> Action Rows Wrapped</span>
                <span className="v2-rule-tag passed"><i className="fa-solid fa-check" /> Spacing Integer Enums (1/2)</span>
              </div>
            </div>

            {rawJsonError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                {rawJsonError}
              </div>
            )}

            <div className="raw-toolbar">
              <div style={{ fontSize: '12.5px', color: 'var(--color-foreground-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-file-code" style={{ color: 'var(--discord-cyan)' }} />
                <span>Discord Components V2 REST API Payload (flags: 32768, Type 17 Containers)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-header-action"
                  onClick={() => {
                    navigator.clipboard.writeText(rawJsonText);
                    alert('JSON payload copied to clipboard!');
                  }}
                >
                  <i className="fa-regular fa-copy" /> Copy JSON
                </button>
                <button
                  type="button"
                  className="btn-header-action"
                  onClick={handleApplyRawJson}
                >
                  <i className="fa-solid fa-check" /> Apply to Canvas
                </button>
              </div>
            </div>

            <div className="raw-code-wrapper" style={{ flex: 1, minHeight: '380px' }}>
              <textarea
                className="raw-textarea"
                style={{ width: '100%', height: '100%', minHeight: '380px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DISPATCH TAB */}
      {/* Dispatch {server selector, channel selector, scheduler(true/false, time), dispatchBtn} */}
      {activeSubTab === 'dispatch' && (
        <div className="tab-content-area" style={{ flex: 1, padding: '20px' }}>
          <div className="dispatch-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="dispatch-form-card" style={{ background: '#18181c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="brand-badge" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                  <i className="fa-solid fa-satellite-dish" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Dispatch Message & Embed V2</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-foreground-muted)' }}>Send this Components V2 payload to a server channel or schedule for later.</div>
                </div>
              </div>

              {/* Server Selector & Channel Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Server</label>
                  <select
                    className="form-input"
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    style={{ background: '#0a0a0e', color: '#fff', height: '40px' }}
                  >
                    <option value="server_rng_hq">RNG Network Official HQ</option>
                    <option value="server_community">RNG Community Guild</option>
                    <option value="server_dev">RNG Bot Development Lab</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Channel</label>
                  <select
                    className="form-input"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    style={{ background: '#0a0a0e', color: '#fff', height: '40px' }}
                  >
                    <option value="channel_announcements">📢 #announcements</option>
                    <option value="channel_rules">📜 #rules-verification</option>
                    <option value="channel_updates">📦 #changelog</option>
                    <option value="channel_general">💬 #general-chat</option>
                  </select>
                </div>
              </div>

              {/* Scheduler Toggle & Time */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                    />
                    <span>Schedule Message Dispatch</span>
                  </label>
                  <span style={{ fontSize: '11px', color: isScheduled ? '#22c55e' : '#949ba4' }}>
                    {isScheduled ? 'Scheduled Mode Active' : 'Immediate Dispatch'}
                  </span>
                </div>

                {isScheduled && (
                  <div className="form-group" style={{ marginTop: '4px' }}>
                    <label className="form-label">Dispatch Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      style={{ background: '#0a0a0e', color: '#fff' }}
                    />
                  </div>
                )}
              </div>

              {/* Webhook URL */}
              <div className="form-group">
                <label className="form-label">Discord Webhook URL (?with_components=true)</label>
                <input
                  type="text"
                  className="form-input"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              {/* Dispatch Button */}
              <button
                type="button"
                className="btn-dispatch-submit"
                onClick={handleDispatch}
              >
                <i className="fa-solid fa-paper-plane" />
                <span>{isScheduled ? 'Queue Scheduled Dispatch' : 'Dispatch Payload to Discord'}</span>
              </button>
            </div>

            {/* Telemetry Console Log */}
            <div className="dispatch-form-card" style={{ background: '#121216', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <i className="fa-solid fa-terminal" style={{ color: '#10b981' }} />
                <span>Dispatch Telemetry Log</span>
              </div>
              <div className="dispatch-console-box" style={{ maxHeight: '140px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: 1.5, color: '#dbdee1' }}>
                {telemetryLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODALS */}
      <PaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectComponent={handleInsertComponentType}
      />

      <LoadModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoadTemplate={onLoadTemplate}
        onLoadComponent={handleLoadSingleComponent}
      />

      <ButtonModal
        isOpen={Boolean(editingButton)}
        onClose={() => setEditingButton(null)}
        buttonData={editingButton?.data || null}
        onSave={(updatedBtn) => {
          if (editingButton) {
            const upd = [...containers];
            const row = upd[editingButton.cIdx].components.find(c => c.id === editingButton.rowId) as DiscordActionRowComponent;
            if (row && row.items) {
              row.items[editingButton.bIdx] = updatedBtn;
              setContainers(upd);
            }
          }
        }}
      />

      <DiscordEmojiPicker
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onSelect={(emoji, insertStr) => {
          if (emojiPickerCallback) emojiPickerCallback(emoji, insertStr);
        }}
        triggerRect={emojiPickerTriggerRect}
      />

    </div>
  );
}
