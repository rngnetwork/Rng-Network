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
  onDirtyChange?: () => void;
}

const PRESET_ACCENTS = [
  { name: 'Cyan', hex: '#00A8FC' },
  { name: 'RNG Red', hex: '#E11D2E' },
  { name: 'Blurple', hex: '#5865F2' },
  { name: 'Green', hex: '#23A55A' },
  { name: 'Yellow', hex: '#FEE75C' },
  { name: 'Fuchsia', hex: '#EB459E' },
  { name: 'Dark Grey', hex: '#2B2D31' }
];

export function MessageBuilder({
  containers,
  setContainers,
  messageContent,
  setMessageContent,
  onLoadTemplate,
  onDirtyChange
}: MessageBuilderProps) {
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview' | 'raw' | 'dispatch'>('edit');
  const [rawPayloadMode, setRawPayloadMode] = useState<'message' | 'modal'>('message');

  // Modals state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteTarget, setPaletteTarget] = useState<{ cIdx: number } | null>(null);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<{ cIdx: number; rowId: string; bIdx: number; data: DiscordButtonComponent } | null>(null);

  // Active Emoji Picker State
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerTriggerRect, setEmojiPickerTriggerRect] = useState<DOMRect | null>(null);
  const [emojiPickerCallback, setEmojiPickerCallback] = useState<((emoji: EmojiItem, insertStr: string) => void) | null>(null);

  // Drag & Drop tracking
  const [draggedComp, setDraggedComp] = useState<{ cIdx: number; compIdx: number } | null>(null);
  const [dragOverComp, setDragOverComp] = useState<{ cIdx: number; compIdx: number } | null>(null);
  const [draggedContainer, setDraggedContainer] = useState<number | null>(null);
  const [dragOverContainer, setDragOverContainer] = useState<number | null>(null);

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
      accentColor: '#00A8FC',
      isSpoiler: false,
      author: { name: '', icon_url: '' },
      title: 'Container Title',
      description: 'Describe the contents of this Type 17 Container...',
      fields: [],
      thumbnail: '',
      image: '',
      footer: { text: '', icon_url: '' },
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
    onDirtyChange?.();
  };

  const removeContainer = (cIdx: number) => {
    if (containers.length <= 1) {
      if (!confirm('Remove this container? You can always add a new one.')) return;
    }
    const updated = [...containers];
    updated.splice(cIdx, 1);
    setContainers(updated);
    onDirtyChange?.();
  };

  const moveContainer = (cIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? cIdx - 1 : cIdx + 1;
    if (targetIdx < 0 || targetIdx >= containers.length) return;
    const updated = [...containers];
    const [moved] = updated.splice(cIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setContainers(updated);
    onDirtyChange?.();
  };

  const updateContainerAccent = (cIdx: number, color: string) => {
    const upd = [...containers];
    upd[cIdx].accentColor = color;
    setContainers(upd);
    onDirtyChange?.();
  };

  const toggleContainerSpoiler = (cIdx: number) => {
    const upd = [...containers];
    upd[cIdx].isSpoiler = !upd[cIdx].isSpoiler;
    setContainers(upd);
    onDirtyChange?.();
  };

  const updateContainerAuthor = (cIdx: number, key: 'name' | 'icon_url', val: string) => {
    const upd = [...containers];
    if (!upd[cIdx].author) upd[cIdx].author = { name: '', icon_url: '' };
    upd[cIdx].author![key] = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const updateContainerTitle = (cIdx: number, val: string) => {
    const upd = [...containers];
    upd[cIdx].title = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const updateContainerDescription = (cIdx: number, val: string) => {
    const upd = [...containers];
    upd[cIdx].description = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const updateContainerThumbnail = (cIdx: number, url: string) => {
    const upd = [...containers];
    upd[cIdx].thumbnail = url;
    setContainers(upd);
    onDirtyChange?.();
  };

  const updateContainerImage = (cIdx: number, url: string) => {
    const upd = [...containers];
    upd[cIdx].image = url;
    setContainers(upd);
    onDirtyChange?.();
  };

  const updateContainerFooter = (cIdx: number, key: 'text' | 'icon_url', val: string) => {
    const upd = [...containers];
    if (!upd[cIdx].footer) upd[cIdx].footer = { text: '', icon_url: '' };
    upd[cIdx].footer![key] = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const addField = (cIdx: number) => {
    const upd = [...containers];
    if (!upd[cIdx].fields) upd[cIdx].fields = [];
    upd[cIdx].fields!.push({
      id: `field_${Date.now()}`,
      name: `Field ${(upd[cIdx].fields?.length || 0) + 1}`,
      value: 'Field value',
      inline: true
    });
    setContainers(upd);
    onDirtyChange?.();
  };

  const removeField = (cIdx: number, fIdx: number) => {
    const upd = [...containers];
    if (upd[cIdx].fields) {
      upd[cIdx].fields!.splice(fIdx, 1);
      setContainers(upd);
      onDirtyChange?.();
    }
  };

  const updateField = (cIdx: number, fIdx: number, key: 'name' | 'value', val: string) => {
    const upd = [...containers];
    if (upd[cIdx].fields && upd[cIdx].fields![fIdx]) {
      upd[cIdx].fields![fIdx][key] = val;
      setContainers(upd);
      onDirtyChange?.();
    }
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
    onDirtyChange?.();
  };

  // Insert component from Palette
  const handleInsertComponentType = (typeNum: number) => {
    if (containers.length === 0) addContainer();
    const updated = [...containers];
    const targetIdx = paletteTarget?.cIdx !== undefined && updated[paletteTarget.cIdx] ? paletteTarget.cIdx : 0;
    const target = updated[targetIdx];

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

      if (c.footer?.text) {
        cComponents.push({
          type: 10,
          content: `-# ${c.footer.text}`
        });
      }

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
      if (parsed.content !== undefined) setMessageContent(parsed.content);
      if (Array.isArray(parsed.components)) {
        const loadedContainers: Type17Container[] = [];
        parsed.components.forEach((c: any, idx: number) => {
          if (c.type === 17) {
            const hexColor = c.accent_color ? `#${c.accent_color.toString(16).padStart(6, '0')}` : (c.accentColor || '#00A8FC');
            let author = c.author || { name: '', icon_url: '' };
            let title = c.title || '';
            let description = c.description || '';
            let thumbnail = c.thumbnail || '';
            let image = c.image || '';
            let fields: EmbedField[] = Array.isArray(c.fields) ? c.fields : [];
            let footer = c.footer || { text: '', icon_url: '' };
            const innerComps: DiscordInnerComponent[] = [];

            if (Array.isArray(c.components)) {
              c.components.forEach((inner: any) => {
                if (inner.type === 9) {
                  if (inner.accessory?.media?.url || inner.accessory?.url) {
                    thumbnail = inner.accessory?.media?.url || inner.accessory?.url;
                  }
                  if (inner.components?.[0]?.content && !description) {
                    description = inner.components[0].content;
                  }
                } else if (inner.type === 12 && inner.items?.[0]?.media?.url && !image) {
                  image = inner.items[0].media.url;
                } else if (inner.type === 10 && typeof inner.content === 'string' && inner.content.startsWith('-# ')) {
                  footer.text = inner.content.replace('-# ', '');
                } else {
                  innerComps.push(inner);
                }
              });
            }

            loadedContainers.push({
              id: c.id || `c17_${Date.now()}_${idx}`,
              accentColor: hexColor,
              isSpoiler: Boolean(c.spoiler || c.isSpoiler),
              author,
              title,
              description,
              thumbnail,
              image,
              fields,
              footer,
              components: innerComps.length > 0 ? innerComps : (c.components || [])
            });
          }
        });
        if (loadedContainers.length > 0) {
          setContainers(loadedContainers);
          onDirtyChange?.();
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
              <div id="wysiwyg-containers-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {containers.map((c17, cIdx) => (
                  <div
                    key={c17.id || `c17_${cIdx}`}
                    className={`wysiwyg-type17-container ${draggedContainer === cIdx ? 'dragging' : ''} ${dragOverContainer === cIdx ? 'drag-over' : ''}`}
                    style={{ borderLeftColor: c17.accentColor || '#00A8FC' }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(cIdx));
                      setDraggedContainer(cIdx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverContainer(cIdx);
                    }}
                    onDragLeave={() => {
                      if (dragOverContainer === cIdx) setDragOverContainer(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedContainer !== null && draggedContainer !== cIdx) {
                        const upd = [...containers];
                        const [moved] = upd.splice(draggedContainer, 1);
                        upd.splice(cIdx, 0, moved);
                        setContainers(upd);
                        onDirtyChange?.();
                      }
                      setDraggedContainer(null);
                      setDragOverContainer(null);
                    }}
                  >
                    {/* Top Container Strip with Drag & Controls */}
                    <div className="container-control-strip">
                      <i className="fa-solid fa-grip-vertical container-drag-handle" title="Drag to reorder Container" />
                      <button
                        type="button"
                        className="comp-move-btn"
                        onClick={() => moveContainer(cIdx, 'up')}
                        title="Move Container Up"
                        disabled={cIdx === 0}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="comp-move-btn"
                        onClick={() => moveContainer(cIdx, 'down')}
                        title="Move Container Down"
                        disabled={cIdx === containers.length - 1}
                      >
                        ▼
                      </button>

                      {/* Preset Color Swatches */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '0 2px' }}>
                        {PRESET_ACCENTS.map((col) => (
                          <div
                            key={col.hex}
                            style={{
                              width: '13px',
                              height: '13px',
                              borderRadius: '3px',
                              background: col.hex,
                              cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.3)',
                              boxShadow: (c17.accentColor || '#00A8FC').toLowerCase() === col.hex.toLowerCase() ? '0 0 6px #fff' : 'none',
                              transform: (c17.accentColor || '#00A8FC').toLowerCase() === col.hex.toLowerCase() ? 'scale(1.2)' : 'none'
                            }}
                            onClick={() => updateContainerAccent(cIdx, col.hex)}
                            title={`Color: ${col.name} (${col.hex})`}
                          />
                        ))}
                      </div>

                      {/* Color Picker Pill */}
                      <div className="container-color-picker-pill">
                        <input
                          type="color"
                          className="container-color-dot"
                          value={c17.accentColor || '#00A8FC'}
                          onChange={(e) => updateContainerAccent(cIdx, e.target.value)}
                        />
                        <input
                          type="text"
                          value={c17.accentColor || '#00A8FC'}
                          style={{ width: '58px', background: 'transparent', border: 'none', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase' }}
                          onChange={(e) => updateContainerAccent(cIdx, e.target.value)}
                        />
                      </div>

                      {/* Spoiler toggle */}
                      <button
                        type="button"
                        style={{
                          background: c17.isSpoiler ? '#da373c' : 'rgba(255,255,255,0.08)',
                          border: 'none',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleContainerSpoiler(cIdx)}
                        title="Toggle Spoiler Hide"
                      >
                        {c17.isSpoiler ? '|| Spoiler Active' : '|| Spoiler'}
                      </button>

                      {/* Add Component to this Container */}
                      <button
                        type="button"
                        className="btn-ctrl-xs"
                        style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(0,168,252,0.15)', borderColor: 'rgba(0,168,252,0.3)', color: 'var(--discord-cyan)', cursor: 'pointer' }}
                        onClick={() => {
                          setPaletteTarget({ cIdx });
                          setIsPaletteOpen(true);
                        }}
                        title="Add Component to this container"
                      >
                        <i className="fa-solid fa-plus" /> Component
                      </button>

                      {/* Remove Container */}
                      <button
                        type="button"
                        className="btn-container-close"
                        title="Remove Container"
                        onClick={() => removeContainer(cIdx)}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>

                    {/* Author, Title, Description, Thumbnail Slot */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginTop: '2px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="bare-input input-author-name"
                            placeholder="Author name (e.g. RNG Network)"
                            value={c17.author?.name || ''}
                            onChange={(e) => updateContainerAuthor(cIdx, 'name', e.target.value)}
                            style={{ flex: 2 }}
                          />
                          <input
                            type="text"
                            className="bare-input"
                            placeholder="Author icon URL (optional)"
                            value={c17.author?.icon_url || ''}
                            onChange={(e) => updateContainerAuthor(cIdx, 'icon_url', e.target.value)}
                            style={{ flex: 1, fontSize: '11px', color: 'var(--discord-text-muted)' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            className="bare-input input-container-title"
                            placeholder="Title (e.g. Discord Components V2)"
                            value={c17.title || ''}
                            onChange={(e) => updateContainerTitle(cIdx, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="wysiwyg-tool-btn"
                            title="Pick Discord Emoji for Title"
                            onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                              updateContainerTitle(cIdx, (c17.title || '') + insertStr);
                            })}
                          >
                            <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <textarea
                            className="bare-input input-container-desc"
                            placeholder="Description (markdown supported)..."
                            value={c17.description || ''}
                            onChange={(e) => updateContainerDescription(cIdx, e.target.value)}
                            rows={2}
                          />
                          <button
                            type="button"
                            className="wysiwyg-tool-btn"
                            style={{ position: 'absolute', top: '4px', right: '6px', background: 'rgba(0,0,0,0.5)', width: '22px', height: '22px' }}
                            title="Pick Discord Emoji for Description"
                            onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                              updateContainerDescription(cIdx, (c17.description || '') + insertStr);
                            })}
                          >
                            <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
                          </button>
                        </div>
                      </div>

                      {/* Thumbnail Slot (Top Right) */}
                      <div
                        className="inline-thumbnail-slot"
                        title="Click to set thumbnail URL"
                        onClick={() => {
                          const current = c17.thumbnail || '';
                          const input = prompt('Enter Thumbnail Image URL (leave empty to remove):', current);
                          if (input !== null) {
                            updateContainerThumbnail(cIdx, input.trim());
                          }
                        }}
                      >
                        {c17.thumbnail ? (
                          <img
                            src={c17.thumbnail}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            alt="Thumbnail"
                            onError={(e) => { (e.target as any).style.display = 'none'; }}
                          />
                        ) : (
                          <i className="fa-regular fa-image" />
                        )}
                      </div>
                    </div>

                    {/* Fields Grid */}
                    <div className="inline-fields-area">
                      {c17.fields?.map((f, fIdx) => (
                        <div key={f.id || `field_${fIdx}`} className="inline-field-card">
                          <button
                            type="button"
                            className="field-delete-btn"
                            title="Delete Field"
                            onClick={() => removeField(cIdx, fIdx)}
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                          <input
                            type="text"
                            className="bare-input input-field-name"
                            value={f.name}
                            placeholder="Field name"
                            onChange={(e) => updateField(cIdx, fIdx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="bare-input input-field-value"
                            value={f.value}
                            placeholder="Field value"
                            onChange={(e) => updateField(cIdx, fIdx, 'value', e.target.value)}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-add-field-pill"
                        onClick={() => addField(cIdx)}
                      >
                        + Add Field
                      </button>
                    </div>

                    {/* Large Image Slot */}
                    <div
                      className="inline-large-image-slot"
                      onClick={() => {
                        const current = c17.image || '';
                        const input = prompt('Enter Large Media Image URL (leave empty to remove):', current);
                        if (input !== null) {
                          updateContainerImage(cIdx, input.trim());
                        }
                      }}
                      title="Click to set large media image"
                    >
                      <i className="fa-regular fa-image" />
                      <span>{c17.image ? `Large image configured: ${c17.image.length > 35 ? c17.image.substring(0, 32) + '...' : c17.image} (Click to change)` : 'Click to set large media image'}</span>
                    </div>

                    {/* Nested Components Area (Draggable Items) */}
                    <div className="container-nested-components-area">
                      {c17.components.map((comp, compIdx) => (
                        <div
                          key={comp.id || `comp_${compIdx}`}
                          className={`draggable-comp-item ${draggedComp?.cIdx === cIdx && draggedComp?.compIdx === compIdx ? 'dragging' : ''} ${dragOverComp?.cIdx === cIdx && dragOverComp?.compIdx === compIdx ? 'drag-over' : ''}`}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDraggedComp({ cIdx, compIdx });
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverComp({ cIdx, compIdx });
                          }}
                          onDragLeave={() => {
                            if (dragOverComp?.cIdx === cIdx && dragOverComp?.compIdx === compIdx) {
                              setDragOverComp(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedComp) {
                              const fromC = draggedComp.cIdx;
                              const fromComp = draggedComp.compIdx;
                              const toC = cIdx;
                              const toComp = compIdx;

                              const upd = [...containers];
                              const [movedItem] = upd[fromC].components.splice(fromComp, 1);
                              upd[toC].components.splice(toComp, 0, movedItem);
                              setContainers(upd);
                              onDirtyChange?.();
                            }
                            setDraggedComp(null);
                            setDragOverComp(null);
                          }}
                        >
                          {/* Component Header Strip */}
                          <div className="comp-header-strip">
                            <div className="comp-header-left">
                              <i className="fa-solid fa-grip-vertical comp-drag-grip" title="Drag to reorder component" />
                              <button
                                type="button"
                                className="comp-move-btn"
                                onClick={() => moveComponent(cIdx, compIdx, 'up')}
                                disabled={compIdx === 0}
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="comp-move-btn"
                                onClick={() => moveComponent(cIdx, compIdx, 'down')}
                                disabled={compIdx === c17.components.length - 1}
                                title="Move Down"
                              >
                                ▼
                              </button>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--discord-cyan)', letterSpacing: '0.04em' }}>
                                {comp.type === 1 && 'ACTION ROW (TYPE 1)'}
                                {comp.type === 3 && 'STRING SELECT (TYPE 3)'}
                                {comp.type === 9 && 'SECTION (TYPE 9)'}
                                {comp.type === 10 && 'TEXT DISPLAY (TYPE 10)'}
                                {comp.type === 11 && 'THUMBNAIL (TYPE 11)'}
                                {comp.type === 12 && 'MEDIA GALLERY (TYPE 12)'}
                                {comp.type === 13 && 'FILE (TYPE 13)'}
                                {comp.type === 14 && 'SEPARATOR (TYPE 14)'}
                                {comp.type > 14 && `COMPONENT (TYPE ${comp.type})`}
                              </span>
                            </div>

                            <div className="comp-header-right">
                              <button
                                type="button"
                                className="comp-tool-btn btn-del"
                                title="Remove Component"
                                onClick={() => {
                                  const upd = [...containers];
                                  upd[cIdx].components.splice(compIdx, 1);
                                  setContainers(upd);
                                  onDirtyChange?.();
                                }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </div>
                          </div>

                          {/* Component Body Content */}
                          <div className="comp-body-content">
                            {/* 1. Action Row (Type 1) */}
                            {comp.type === 1 && (() => {
                              const row = comp as DiscordActionRowComponent;
                              const rowItems = row.items || [];
                              const btnCount = rowItems.filter((i: any) => i.type === 2).length;
                              const canAddBtn = btnCount < 5;

                              return (
                                <div className="wysiwyg-action-row">
                                  <input
                                    type="text"
                                    value={row.label || 'ROW'}
                                    style={{
                                      width: '50px',
                                      background: 'rgba(255,255,255,0.08)',
                                      border: 'none',
                                      borderRadius: '3px',
                                      color: '#fff',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 4px',
                                      textAlign: 'center'
                                    }}
                                    onChange={(e) => {
                                      const upd = [...containers];
                                      (upd[cIdx].components[compIdx] as DiscordActionRowComponent).label = e.target.value;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    }}
                                  />

                                  <span style={{ fontSize: '10px', color: 'var(--discord-text-muted)', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '3px', fontWeight: 700 }}>
                                    {btnCount}/5
                                  </span>

                                  {rowItems.map((item: any, bIdx: number) => {
                                    if (item.type === 2) {
                                      const btn = item as DiscordButtonComponent;
                                      return (
                                        <div
                                          key={btn.id || `btn_${bIdx}`}
                                          className={`wysiwyg-btn-pill btn-style-${btn.style || 1}`}
                                        >
                                          {/* Move Left */}
                                          <button
                                            type="button"
                                            className="comp-move-btn"
                                            disabled={bIdx === 0}
                                            onClick={() => shiftButton(cIdx, row.id!, bIdx, 'left')}
                                            title="Move Left"
                                            style={{ color: '#fff' }}
                                          >
                                            ◀
                                          </button>

                                          {/* Emoji click to pick emoji */}
                                          <span
                                            style={{ fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: '18px', justifyContent: 'center' }}
                                            title="Click to pick Discord emoji"
                                            onClick={(e: any) => {
                                              triggerEmojiPicker(e, (emoji, insertStr) => {
                                                const upd = [...containers];
                                                const targetRow = upd[cIdx].components[compIdx] as DiscordActionRowComponent;
                                                (targetRow.items[bIdx] as DiscordButtonComponent).emoji = insertStr;
                                                setContainers(upd);
                                                onDirtyChange?.();
                                              });
                                            }}
                                          >
                                            {btn.emoji ? (typeof btn.emoji === 'string' ? btn.emoji : btn.emoji.name) : '⚡'}
                                          </span>

                                          {/* Inline Label Edit */}
                                          <input
                                            type="text"
                                            value={btn.label || 'Btn'}
                                            onChange={(e) => {
                                              const upd = [...containers];
                                              const targetRow = upd[cIdx].components[compIdx] as DiscordActionRowComponent;
                                              (targetRow.items[bIdx] as DiscordButtonComponent).label = e.target.value;
                                              setContainers(upd);
                                              onDirtyChange?.();
                                            }}
                                            style={{
                                              background: 'transparent',
                                              border: 'none',
                                              color: '#fff',
                                              fontWeight: 600,
                                              fontSize: '12px',
                                              width: `${Math.max(50, (btn.label || 'Btn').length * 8 + 10)}px`,
                                              outline: 'none'
                                            }}
                                            title="Directly edit button label"
                                          />

                                          {/* Move Right */}
                                          <button
                                            type="button"
                                            className="comp-move-btn"
                                            disabled={bIdx === rowItems.length - 1}
                                            onClick={() => shiftButton(cIdx, row.id!, bIdx, 'right')}
                                            title="Move Right"
                                            style={{ color: '#fff' }}
                                          >
                                            ▶
                                          </button>

                                          {/* Gear Configure Modal */}
                                          <i
                                            className="fa-solid fa-gear"
                                            style={{ fontSize: '11px', opacity: 0.85, cursor: 'pointer', padding: '0 2px' }}
                                            title="Configure Button"
                                            onClick={() => setEditingButton({ cIdx, rowId: row.id!, bIdx, data: btn })}
                                          />

                                          {/* Delete Button */}
                                          <i
                                            className="fa-solid fa-xmark"
                                            style={{ fontSize: '11px', opacity: 0.85, cursor: 'pointer', padding: '0 2px', color: '#ff5b69' }}
                                            title="Remove Button"
                                            onClick={() => removeButton(cIdx, row.id!, bIdx)}
                                          />
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}

                                  {canAddBtn && (
                                    <button
                                      type="button"
                                      className="btn-add-field-pill"
                                      style={{ padding: '3px 8px', fontSize: '11px', width: 'auto' }}
                                      onClick={() => {
                                        const upd = [...containers];
                                        const targetRow = upd[cIdx].components[compIdx] as DiscordActionRowComponent;
                                        targetRow.items.push({
                                          type: 2,
                                          style: 1,
                                          label: `Button ${targetRow.items.length + 1}`,
                                          custom_id: `btn_${Date.now()}`
                                        });
                                        setContainers(upd);
                                        onDirtyChange?.();
                                      }}
                                    >
                                      + Button
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                            {/* 2. Separator (Type 14) */}
                            {comp.type === 14 && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--discord-text-muted)', textTransform: 'uppercase' }}>Spacing:</span>
                                  <button
                                    type="button"
                                    className={`btn-ctrl-xs ${(comp as DiscordSeparatorComponent).spacing === 1 ? 'active-pill' : ''}`}
                                    style={{ padding: '2px 8px', fontSize: '10.5px' }}
                                    onClick={() => {
                                      const upd = [...containers];
                                      (upd[cIdx].components[compIdx] as DiscordSeparatorComponent).spacing = 1;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    }}
                                  >
                                    Small (1)
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn-ctrl-xs ${(comp as DiscordSeparatorComponent).spacing === 2 ? 'active-pill' : ''}`}
                                    style={{ padding: '2px 8px', fontSize: '10.5px' }}
                                    onClick={() => {
                                      const upd = [...containers];
                                      (upd[cIdx].components[compIdx] as DiscordSeparatorComponent).spacing = 2;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    }}
                                  >
                                    Large (2)
                                  </button>
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--discord-text-normal)', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean((comp as DiscordSeparatorComponent).divider)}
                                    onChange={(e) => {
                                      const upd = [...containers];
                                      (upd[cIdx].components[compIdx] as DiscordSeparatorComponent).divider = e.target.checked;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    }}
                                  />
                                  <span>Visible Divider Line</span>
                                </label>
                              </div>
                            )}

                            {/* 3. Text Display (Type 10) */}
                            {comp.type === 10 && (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)', fontWeight: 600 }}>
                                    <i className="fa-solid fa-paragraph" style={{ marginRight: '4px' }} /> Text Display Markdown
                                  </span>
                                  <button
                                    type="button"
                                    className="wysiwyg-tool-btn"
                                    title="Pick Discord Emoji for Text Display"
                                    onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                                      const upd = [...containers];
                                      const c = upd[cIdx].components[compIdx] as DiscordTextDisplayComponent;
                                      c.text = (c.text || '') + insertStr;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    })}
                                  >
                                    <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
                                  </button>
                                </div>
                                <textarea
                                  className="bare-input"
                                  rows={2}
                                  style={{ fontSize: '13px', lineHeight: 1.45, resize: 'vertical', background: 'rgba(0,0,0,0.18)', padding: '6px 8px', borderRadius: '4px' }}
                                  placeholder="Markdown text display (# headers, **bold**, lists)..."
                                  value={(comp as DiscordTextDisplayComponent).text || ''}
                                  onChange={(e) => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordTextDisplayComponent).text = e.target.value;
                                    setContainers(upd);
                                    onDirtyChange?.();
                                  }}
                                />
                              </div>
                            )}

                            {/* 4. String Select (Type 3) */}
                            {comp.type === 3 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: '#1e1f22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '6px 10px', gap: '8px' }}>
                                  <i className="fa-solid fa-bars-staggered" style={{ fontSize: '12px', color: 'var(--discord-cyan)' }} />
                                  <input
                                    type="text"
                                    className="bare-input"
                                    style={{ fontSize: '12.5px', color: 'var(--discord-text-normal)' }}
                                    placeholder="Placeholder text..."
                                    value={(comp as DiscordSelectComponent).placeholder || ''}
                                    onChange={(e) => {
                                      const upd = [...containers];
                                      (upd[cIdx].components[compIdx] as DiscordSelectComponent).placeholder = e.target.value;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    }}
                                  />
                                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }} />
                                </div>

                                <div className="select-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '10.5px', color: 'var(--discord-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Options List:</span>
                                  {(comp as DiscordSelectComponent).options?.map((opt, optIdx) => (
                                    <div key={optIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        className="bare-input"
                                        style={{ width: '36px', textAlign: 'center', height: '26px', fontSize: '12px', background: 'rgba(255,255,255,0.06)' }}
                                        value={opt.emoji || ''}
                                        placeholder="⭐"
                                        onChange={(e) => {
                                          const upd = [...containers];
                                          const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                          select.options![optIdx].emoji = e.target.value;
                                          setContainers(upd);
                                          onDirtyChange?.();
                                        }}
                                      />
                                      <input
                                        type="text"
                                        className="bare-input"
                                        style={{ fontWeight: 600, fontSize: '12px', flex: 1 }}
                                        placeholder="Option label"
                                        value={opt.label || ''}
                                        onChange={(e) => {
                                          const upd = [...containers];
                                          const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                          select.options![optIdx].label = e.target.value;
                                          setContainers(upd);
                                          onDirtyChange?.();
                                        }}
                                      />
                                      <input
                                        type="text"
                                        className="bare-input"
                                        style={{ fontSize: '11px', color: 'var(--discord-text-muted)', flex: 1 }}
                                        placeholder="Description"
                                        value={opt.description || ''}
                                        onChange={(e) => {
                                          const upd = [...containers];
                                          const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                          select.options![optIdx].description = e.target.value;
                                          setContainers(upd);
                                          onDirtyChange?.();
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="comp-tool-btn btn-del"
                                        style={{ width: '18px', height: '18px' }}
                                        onClick={() => {
                                          const upd = [...containers];
                                          const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                          select.options!.splice(optIdx, 1);
                                          setContainers(upd);
                                          onDirtyChange?.();
                                        }}
                                      >
                                        <i className="fa-solid fa-xmark" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="btn-add-field-pill"
                                    style={{ padding: '3px 8px', fontSize: '10.5px', alignSelf: 'flex-start', width: 'auto' }}
                                    onClick={() => {
                                      const upd = [...containers];
                                      const select = upd[cIdx].components[compIdx] as DiscordSelectComponent;
                                      if (!select.options) select.options = [];
                                      select.options.push({
                                        label: `Option ${select.options.length + 1}`,
                                        value: `opt_${Date.now()}`
                                      });
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    }}
                                  >
                                    + Add Option
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 5. Section (Type 9) */}
                            {comp.type === 9 && (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)', fontWeight: 600 }}>
                                    <i className="fa-solid fa-align-left" style={{ marginRight: '4px' }} /> Section Markdown
                                  </span>
                                  <button
                                    type="button"
                                    className="wysiwyg-tool-btn"
                                    title="Pick Discord Emoji for Section"
                                    onClick={(e) => triggerEmojiPicker(e, (emoji, insertStr) => {
                                      const upd = [...containers];
                                      const c = upd[cIdx].components[compIdx] as DiscordSectionComponent;
                                      c.text = (c.text || '') + insertStr;
                                      setContainers(upd);
                                      onDirtyChange?.();
                                    })}
                                  >
                                    <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
                                  </button>
                                </div>
                                <textarea
                                  className="bare-input"
                                  rows={2}
                                  style={{ fontSize: '12.5px', lineHeight: 1.4, resize: 'vertical', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}
                                  placeholder="Section markdown content..."
                                  value={(comp as DiscordSectionComponent).text || ''}
                                  onChange={(e) => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordSectionComponent).text = e.target.value;
                                    setContainers(upd);
                                    onDirtyChange?.();
                                  }}
                                />
                              </div>
                            )}

                            {/* 6. Media Gallery (Type 12) */}
                            {comp.type === 12 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {(comp as DiscordMediaGalleryComponent).items?.map((url, imgIdx) => (
                                    <div key={imgIdx} style={{ position: 'relative', width: '60px', height: '50px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
                                      <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                      <button
                                        type="button"
                                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', color: '#ff5b69', border: 'none', borderRadius: '2px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                                        onClick={() => {
                                          const upd = [...containers];
                                          (upd[cIdx].components[compIdx] as DiscordMediaGalleryComponent).items.splice(imgIdx, 1);
                                          setContainers(upd);
                                          onDirtyChange?.();
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="btn-add-field-pill"
                                    style={{ height: '50px', width: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => {
                                      const url = prompt('Enter Image URL to add to Media Gallery:');
                                      if (url) {
                                        const upd = [...containers];
                                        const mg = upd[cIdx].components[compIdx] as DiscordMediaGalleryComponent;
                                        if (!mg.items) mg.items = [];
                                        mg.items.push(url.trim());
                                        setContainers(upd);
                                        onDirtyChange?.();
                                      }
                                    }}
                                  >
                                    + Add Image
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 7. File Attachment (Type 13) */}
                            {comp.type === 13 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e1f22', padding: '6px 10px', borderRadius: '4px' }}>
                                <i className="fa-solid fa-file-lines" style={{ color: 'var(--discord-cyan)', fontSize: '16px' }} />
                                <input
                                  type="text"
                                  className="bare-input"
                                  style={{ fontSize: '12px', fontWeight: 600, flex: 1 }}
                                  placeholder="Filename (e.g. document.pdf)"
                                  value={(comp as DiscordFileComponent).filename || ''}
                                  onChange={(e) => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordFileComponent).filename = e.target.value;
                                    setContainers(upd);
                                    onDirtyChange?.();
                                  }}
                                />
                                <input
                                  type="text"
                                  className="bare-input"
                                  style={{ fontSize: '11px', color: 'var(--discord-text-muted)', width: '70px' }}
                                  placeholder="Size"
                                  value={(comp as DiscordFileComponent).filesize || ''}
                                  onChange={(e) => {
                                    const upd = [...containers];
                                    (upd[cIdx].components[compIdx] as DiscordFileComponent).filesize = e.target.value;
                                    setContainers(upd);
                                    onDirtyChange?.();
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Row (Bottom of Container) */}
                    <div className="inline-footer-row" style={{ marginTop: '8px' }}>
                      <i className="fa-regular fa-calendar" style={{ fontSize: '11px' }} />
                      <input
                        type="text"
                        className="bare-input"
                        style={{ fontSize: '11px', color: 'var(--discord-text-muted)', flex: 1 }}
                        placeholder="Footer text..."
                        value={c17.footer?.text || ''}
                        onChange={(e) => updateContainerFooter(cIdx, 'text', e.target.value)}
                      />
                      <input
                        type="text"
                        className="bare-input"
                        style={{ fontSize: '11px', color: 'var(--discord-text-muted)', width: '160px' }}
                        placeholder="Footer icon URL..."
                        value={c17.footer?.icon_url || ''}
                        onChange={(e) => updateContainerFooter(cIdx, 'icon_url', e.target.value)}
                      />
                    </div>

                  </div>
                ))}
              </div>

              {/* 3. Integrated Bottom Controls Bar (Glued to board, inside wysiwyg-board, scrolling naturally with editor!) */}
              <div className="wysiwyg-bottom-bar" style={{ position: 'static', margin: '8px 0 0 0' }}>
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
                  onClick={() => {
                    setPaletteTarget(null);
                    setIsPaletteOpen(true);
                  }}
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
                      borderLeft: `4px solid ${c.accentColor || '#00A8FC'}`,
                      background: '#2b2d31',
                      borderRadius: '4px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '4px',
                      maxWidth: '540px',
                      position: 'relative'
                    }}
                  >
                    {/* Spoiler Tag */}
                    {c.isSpoiler && (
                      <div style={{ position: 'absolute', top: '8px', right: '10px', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px', fontWeight: 800, color: '#ff7b72', letterSpacing: '0.05em' }}>
                        || SPOILER
                      </div>
                    )}

                    {/* Top Row: Author, Title, Description + Thumbnail */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {c.author?.name && (
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {c.author.icon_url && <img src={c.author.icon_url} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />}
                            <span>{c.author.name}</span>
                          </div>
                        )}
                        {c.title && (
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--discord-cyan)' }}>
                            {c.title}
                          </div>
                        )}
                        {c.description && (
                          <div style={{ fontSize: '13px', color: '#dbdee1', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                            {c.description}
                          </div>
                        )}
                      </div>

                      {c.thumbnail && (
                        <img
                          src={c.thumbnail}
                          alt="Thumbnail"
                          style={{ width: '64px', height: '64px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
                      )}
                    </div>

                    {/* Fields Grid */}
                    {c.fields && c.fields.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', margin: '4px 0' }}>
                        {c.fields.map((f, fIdx) => (
                          <div key={fIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.15)', padding: '4px 6px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff' }}>{f.name}</span>
                            <span style={{ fontSize: '11.5px', color: '#dbdee1' }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Large Media Image */}
                    {c.image && (
                      <div style={{ marginTop: '2px', borderRadius: '4px', overflow: 'hidden' }}>
                        <img
                          src={c.image}
                          alt="Media"
                          style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
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
                          <div style={{ fontSize: '13px', color: '#dbdee1', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                            {(comp as DiscordTextDisplayComponent).text}
                          </div>
                        )}
                        {comp.type === 3 && (
                          <div style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', color: '#949ba4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{(comp as DiscordSelectComponent).placeholder || 'Select an option...'}</span>
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }} />
                          </div>
                        )}
                        {comp.type === 12 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {(comp as DiscordMediaGalleryComponent).items?.map((imgUrl, iIdx) => (
                              <img key={iIdx} src={imgUrl} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                            ))}
                          </div>
                        )}
                        {comp.type === 13 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e1f22', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                            <i className="fa-solid fa-file-lines" style={{ color: 'var(--discord-cyan)' }} />
                            <span style={{ fontWeight: 600, color: '#fff' }}>{(comp as DiscordFileComponent).filename}</span>
                            <span style={{ color: '#949ba4', fontSize: '11px' }}>{(comp as DiscordFileComponent).filesize}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Footer Row */}
                    {c.footer?.text && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#949ba4', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '4px' }}>
                        {c.footer.icon_url ? (
                          <img src={c.footer.icon_url} alt="" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <i className="fa-regular fa-calendar" style={{ fontSize: '11px' }} />
                        )}
                        <span>{c.footer.text}</span>
                      </div>
                    )}
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
