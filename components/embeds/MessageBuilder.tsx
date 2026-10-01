"use client";

import React, { useState } from 'react';
import { Type17Container, DiscordButtonComponent, DiscordActionRowComponent, DiscordInnerComponent } from './types';
import { ChannelItem, ServerItem } from '@/lib/api';
import { EmojiItem } from './emoji-data';

// Modals
import { PaletteModal } from './PaletteModal';
import { ButtonModal } from './ButtonModal';
import { LoadModal } from './LoadModal';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';

// Decoupled Subtabs
import { EditTab } from './builder/subtabs/EditTab';
import { PreviewTab } from './builder/subtabs/PreviewTab';
import { RawTab } from './builder/subtabs/RawTab';
import { DispatchTab } from './builder/subtabs/DispatchTab';
import { TemplatesTab } from './builder/subtabs/TemplatesTab';

export interface MessageBuilderProps {
  containers: Type17Container[];
  setContainers: React.Dispatch<React.SetStateAction<Type17Container[]>>;
  messageContent: string;
  setMessageContent: React.Dispatch<React.SetStateAction<string>>;
  onLoadTemplate?: (state: { message: { content: string }; type17Containers: Type17Container[] }) => void;
  onDirtyChange?: () => void;
  serverId?: string;
  serverName?: string;
  serverChannels?: ChannelItem[];
  serverEmojis?: EmojiItem[];
  availableServers?: ServerItem[];
  onSelectServer?: (serverId: string) => void;
  onDispatchPayload?: (payload: {
    serverId: string;
    channelId: string;
    isScheduled: boolean;
    scheduleTime?: string;
  }) => Promise<void> | void;
  lockServer?: boolean;
}

export function MessageBuilder({
  containers,
  setContainers,
  messageContent,
  setMessageContent,
  onLoadTemplate,
  onDirtyChange,
  serverId,
  serverName,
  serverChannels = [],
  serverEmojis = [],
  availableServers = [],
  onSelectServer,
  onDispatchPayload,
  lockServer = false
}: MessageBuilderProps) {
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview' | 'raw' | 'dispatch' | 'templates'>('edit');

  // Modals state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteTargetCIdx, setPaletteTargetCIdx] = useState<number>(0);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<{
    cIdx: number;
    rowId: string;
    bIdx: number;
    data: DiscordButtonComponent;
  } | null>(null);

  // Active Emoji Picker State
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerTriggerRect, setEmojiPickerTriggerRect] = useState<DOMRect | null>(null);
  const [emojiPickerCallback, setEmojiPickerCallback] = useState<((emoji: EmojiItem, insertStr: string) => void) | null>(null);

  // Drag and drop tracking
  const [draggedComp, setDraggedComp] = useState<{ cIdx: number; compIdx: number } | null>(null);
  const [dragOverComp, setDragOverComp] = useState<{ cIdx: number; compIdx: number } | null>(null);
  const [draggedContainer, setDraggedContainer] = useState<number | null>(null);
  const [collapsedAuthors, setCollapsedAuthors] = useState<Record<number, boolean>>({});

  // Helper to open emoji picker
  const handleOpenEmojiPicker = (
    e: React.MouseEvent<HTMLButtonElement>,
    onSelect: (emoji: EmojiItem, insertStr: string) => void
  ) => {
    setEmojiPickerTriggerRect(e.currentTarget.getBoundingClientRect());
    setEmojiPickerCallback(() => onSelect);
    setEmojiPickerOpen(true);
  };

  // Open component palette modal targeted to a specific container
  const handleOpenPalette = (cIdx = 0) => {
    setPaletteTargetCIdx(cIdx);
    setIsPaletteOpen(true);
  };

  // Insert component from Palette Modal
  const handleInsertComponentType = (typeNum: number) => {
    if (containers.length === 0) {
      setContainers([
        {
          id: `c17_${Date.now()}`,
          accentColor: '#00A8FC',
          components: []
        }
      ]);
    }

    const updated = [...containers];
    const targetIdx = paletteTargetCIdx < updated.length ? paletteTargetCIdx : 0;
    const target = updated[targetIdx];

    if (typeNum === 17) {
      // Add new container
      setContainers([
        ...containers,
        {
          id: `c17_${Date.now()}`,
          accentColor: '#00A8FC',
          title: 'New Container',
          description: '',
          components: []
        }
      ]);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 1) {
      target.components.push({
        type: 1,
        id: `row_${Date.now()}`,
        label: `ROW ${target.components.filter((c) => c.type === 1).length + 1}`,
        items: [
          { type: 2, style: 1, label: 'Action Button', custom_id: `btn_${Date.now()}` }
        ]
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 2) {
      // Adding Button (Type 2) via palette creates a new Action Row containing the button and appends it
      const newRowId = `row_${Date.now()}`;
      target.components.push({
        type: 1,
        id: newRowId,
        label: `ROW ${target.components.filter((c) => c.type === 1).length + 1}`,
        items: [
          {
            type: 2,
            style: 1,
            label: 'Button',
            custom_id: `btn_${Date.now()}`
          }
        ]
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if ([3, 5, 6, 7, 8].includes(typeNum)) {
      // Select Menus
      target.components.push({
        type: typeNum as 3 | 5 | 6 | 7 | 8,
        id: `sel_${Date.now()}`,
        custom_id: `select_${Date.now()}`,
        placeholder: 'Select an option...',
        options: [
          { label: 'Option 1', value: 'opt_1', emoji: '✅', description: 'First choice', default: false },
          { label: 'Option 2', value: 'opt_2', emoji: '⚙️', description: 'Second choice', default: false }
        ]
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 9) {
      target.components.push({
        type: 9,
        id: `sec_${Date.now()}`,
        text: 'Section Markdown summary text...',
        accessory: {
          type: 11,
          media: { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100' }
        }
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 10) {
      target.components.push({
        type: 10,
        id: `txt_${Date.now()}`,
        text: '### Text Display Heading\nDetailed informational markdown content goes here.'
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 12) {
      target.components.push({
        type: 12,
        id: `media_${Date.now()}`,
        items: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400']
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 13) {
      target.components.push({
        type: 13,
        id: `file_${Date.now()}`,
        filename: 'project-document.pdf',
        filesize: '1.4 MB',
        url: 'attachment://project-document.pdf'
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    if (typeNum === 14) {
      target.components.push({
        type: 14,
        id: `sep_${Date.now()}`,
        divider: true,
        spacing: 2
      });
      setContainers(updated);
      onDirtyChange?.();
      return;
    }

    // Modal-only components fallback
    target.components.push({
      type: typeNum as DiscordInnerComponent['type'],
      id: `comp_${Date.now()}`,
      label: `Form Component (Type ${typeNum})`
    } as DiscordInnerComponent);

    setContainers(updated);
    onDirtyChange?.();
  };

  // Open Button Modal
  const handleOpenButtonModal = (cIdx: number, rowId: string, bIdx: number, data: DiscordButtonComponent) => {
    setEditingButton({ cIdx, rowId, bIdx, data });
  };

  // Save Button Modal
  const handleSaveButtonModal = (updated: DiscordButtonComponent) => {
    if (!editingButton) return;
    const { cIdx, rowId, bIdx } = editingButton;
    const updContainers = [...containers];
    const container = updContainers[cIdx];
    if (!container) return;

    // Find Action Row that contains this button by matching rowId
    const actionRow = container.components.find(
      (c): c is DiscordActionRowComponent => c.type === 1 && c.id === rowId
    );
    if (actionRow && actionRow.items && actionRow.items[bIdx]) {
      actionRow.items[bIdx] = updated;
      setContainers(updContainers);
      onDirtyChange?.();
    }
    setEditingButton(null);
  };

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
            <i className="fa-solid fa-pen-to-square text-[#00A8FC]" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('preview')}
          >
            <i className="fa-brands fa-discord text-[#5865F2]" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('raw')}
          >
            <i className="fa-solid fa-code text-[#EC4899]" />
            <span>Raw</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'dispatch' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('dispatch')}
          >
            <i className="fa-solid fa-paper-plane text-[#E11D2E]" />
            <span>Dispatch</span>
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${activeSubTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('templates')}
          >
            <i className="fa-solid fa-layer-group text-amber-400" />
            <span>Templates</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          {serverName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-300 font-medium">
              <i className="fa-brands fa-discord text-[#5865F2]" />
              <span className="truncate max-w-[140px]">{serverName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-400 font-mono">
            <span className="text-zinc-200 font-semibold">{containers.length}</span> Container{containers.length === 1 ? '' : 's'}
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200 font-semibold">{containers.reduce((acc, c) => acc + (c.components?.length || 0), 0)}</span> Components
          </div>
        </div>
      </nav>

      {/* SUB-TAB 1: MERGED WYSIWYG DISCORD CANVAS */}
      {activeSubTab === 'edit' && (
        <EditTab
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          containers={containers}
          setContainers={setContainers}
          onOpenEmojiPicker={handleOpenEmojiPicker}
          onOpenPaletteModal={handleOpenPalette}
          onOpenButtonModal={handleOpenButtonModal}
          onOpenLoadModal={() => setIsLoadModalOpen(true)}
          onDirtyChange={onDirtyChange}
          draggedComp={draggedComp}
          setDraggedComp={setDraggedComp}
          dragOverComp={dragOverComp}
          setDragOverComp={setDragOverComp}
          draggedContainer={draggedContainer}
          setDraggedContainer={setDraggedContainer}
          collapsedAuthors={collapsedAuthors}
          setCollapsedAuthors={setCollapsedAuthors}
        />
      )}

      {/* SUB-TAB 2: CLEAN 1:1 DISCORD LIVE PREVIEW */}
      {activeSubTab === 'preview' && (
        <PreviewTab
          messageContent={messageContent}
          containers={containers}
        />
      )}

      {/* SUB-TAB 3: RAW JSON CODE VIEW */}
      {activeSubTab === 'raw' && (
        <RawTab
          containers={containers}
          setContainers={setContainers}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          onDirtyChange={onDirtyChange}
        />
      )}

      {/* SUB-TAB 4: DISPATCH TO SERVER / CHANNEL */}
      {activeSubTab === 'dispatch' && (
        <DispatchTab
          containers={containers}
          messageContent={messageContent}
          serverId={serverId}
          serverName={serverName}
          serverChannels={serverChannels}
          availableServers={availableServers}
          onSelectServer={onSelectServer}
          onDispatchPayload={onDispatchPayload}
          lockServer={lockServer}
        />
      )}

      {/* SUB-TAB 5: DISCORD TEMPLATES GALLERY */}
      {activeSubTab === 'templates' && (
        <TemplatesTab
          currentBuilderState={{
            message: { content: messageContent },
            type17Containers: containers
          }}
          onLoadTemplate={(presetState) => {
            if (presetState.message?.content !== undefined) {
              setMessageContent(presetState.message.content);
            }
            if (presetState.type17Containers) {
              setContainers(presetState.type17Containers);
            }
            onLoadTemplate?.(presetState);
            onDirtyChange?.();
          }}
          serverId={serverId}
        />
      )}

      {/* PALETTE MODAL: Types 1 to 23 */}
      <PaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectComponent={handleInsertComponentType}
      />

      {/* BUTTON CUSTOMIZER MODAL */}
      <ButtonModal
        isOpen={Boolean(editingButton)}
        onClose={() => setEditingButton(null)}
        buttonData={editingButton?.data || null}
        onSave={handleSaveButtonModal}
      />

      {/* LOAD PRESET MODAL */}
      <LoadModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoadTemplate={(presetState) => {
          if (onLoadTemplate) onLoadTemplate(presetState);
          setIsLoadModalOpen(false);
        }}
        onLoadComponent={(comp: DiscordInnerComponent) => {
          handleInsertComponentType(comp.type);
          setIsLoadModalOpen(false);
        }}
      />

      {/* SHARED DISCORD EMOJI PICKER POPOVER */}
      {emojiPickerOpen && (
        <DiscordEmojiPicker
          isOpen={emojiPickerOpen}
          onClose={() => setEmojiPickerOpen(false)}
          triggerRect={emojiPickerTriggerRect}
          serverEmojis={serverEmojis}
          serverName={serverName}
          onSelect={(emoji: EmojiItem, insertStr: string) => {
            if (emojiPickerCallback) emojiPickerCallback(emoji, insertStr);
            setEmojiPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
