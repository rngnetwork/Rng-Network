'use client';

import React, { useState } from 'react';
import {
  ComponentType,
  type Type17Container,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
} from '@/lib/model/embed';
import { TextInput } from '@/components/common/input/TextInput';
import { ContainerItemCard } from './ContainerItemCard';
import { MarkdownToolbar } from './MarkdownToolbar';

export interface GlobalEditTabCoordinatorProps {
  messageContent: string;
  containers: Type17Container[];
  onChangeMessageContent: (content: string) => void;
  onAddContainer: () => void;
  onUpdateContainer: (
    cIdx: number,
    updates: Partial<Type17Container>
  ) => void;
  onRemoveContainer: (cIdx: number) => void;
  onMoveContainer: (cIdx: number, direction: 'up' | 'down') => void;
  onUpdateAuthor: (cIdx: number, key: 'name' | 'icon_url', val: string) => void;
  onUpdateFooter: (cIdx: number, key: 'text' | 'icon_url', val: string) => void;
  onAddField: (cIdx: number) => void;
  onUpdateField: (
    cIdx: number,
    fIdx: number,
    key: 'name' | 'value' | 'inline',
    val: string | boolean
  ) => void;
  onRemoveField: (cIdx: number, fIdx: number) => void;
  onAddComponent: (cIdx: number, componentType: ComponentType) => void;
  onUpdateComponent: (
    cIdx: number,
    compIdx: number,
    updated: DiscordInnerComponent
  ) => void;
  onRemoveComponent: (cIdx: number, compIdx: number) => void;
  onDuplicateComponent: (cIdx: number, compIdx: number) => void;
  onEditButton: (
    cIdx: number,
    button: DiscordButtonComponent,
    rowId?: string
  ) => void;
  onEditSelectMenu: (
    cIdx: number,
    select: DiscordStringSelectComponent
  ) => void;
  onOpenPaletteModal: (cIdx: number) => void;
  onOpenEmojiPicker?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const GlobalEditTabCoordinator: React.FC<
  GlobalEditTabCoordinatorProps
> = ({
  messageContent,
  containers,
  onChangeMessageContent,
  onUpdateContainer,
  onRemoveContainer,
  onMoveContainer,
  onUpdateAuthor,
  onUpdateFooter,
  onAddField,
  onUpdateField,
  onRemoveField,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onEditButton,
  onEditSelectMenu,
  onOpenPaletteModal,
  onOpenEmojiPicker,
}) => {
  const [collapsedAuthors, setCollapsedAuthors] = useState<Record<number, boolean>>({});
  const [draggedContainer, setDraggedContainer] = useState<number | null>(null);
  const [draggedComp, setDraggedComp] = useState<{ cIdx: number; compIdx: number } | null>(null);
  const [dragOverComp, setDragOverComp] = useState<{ cIdx: number; compIdx: number } | null>(null);

  const handleToggleAuthorCollapse = (cIdx: number) => {
    setCollapsedAuthors((prev) => ({ ...prev, [cIdx]: !prev[cIdx] }));
  };

  const handleApplyMarkdown = (prefix: string, suffix: string) => {
    onChangeMessageContent(`${messageContent}${prefix}text${suffix}`);
  };

  const handleContainerDragStart = (e: React.DragEvent, cIdx: number) => {
    setDraggedContainer(cIdx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContainerDrop = (e: React.DragEvent, targetCIdx: number) => {
    e.preventDefault();
    if (draggedContainer === null || draggedContainer === targetCIdx) return;
    const direction = draggedContainer < targetCIdx ? 'down' : 'up';
    onMoveContainer(draggedContainer, direction);
    setDraggedContainer(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top-Level Text Display Input */}
      <div className="p-4 rounded-apple-xl bg-surface-card border border-white/10 flex flex-col gap-3 shadow-apple-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-white">
            Top-Level Text Display (Auto-Wrapped Leading Content)
          </label>
          <MarkdownToolbar
            onApplyMarkdown={handleApplyMarkdown}
            onOpenEmojiPicker={onOpenEmojiPicker}
          />
        </div>

        <TextInput
          value={messageContent}
          onChange={(e) => onChangeMessageContent(e.target.value)}
          placeholder="Optional introductory text or role ping above all Type 17 containers..."
          helperText="Discord Components V2 automatically wraps leading message content into a top-level Type 10 Text Display component."
        />
      </div>

      {/* Containers List */}
      <div className="flex flex-col gap-5">
        {containers.map((container, cIdx) => (
          <ContainerItemCard
            key={container.id || `cnt_${cIdx}`}
            cIdx={cIdx}
            totalContainers={containers.length}
            container={container}
            isAuthorCollapsed={Boolean(collapsedAuthors[cIdx])}
            onUpdateAccent={(idx, color) => onUpdateContainer(idx, { accentColor: color })}
            onToggleSpoiler={(idx) => onUpdateContainer(idx, { isSpoiler: !container.isSpoiler })}
            onToggleAuthorCollapse={handleToggleAuthorCollapse}
            onMoveContainer={onMoveContainer}
            onRemoveContainer={onRemoveContainer}
            onUpdateContainer={onUpdateContainer}
            onUpdateAuthor={onUpdateAuthor}
            onUpdateFooter={onUpdateFooter}
            onAddField={onAddField}
            onUpdateField={onUpdateField}
            onRemoveField={onRemoveField}
            onAddComponent={onAddComponent}
            onUpdateComponent={onUpdateComponent}
            onRemoveComponent={onRemoveComponent}
            onDuplicateComponent={onDuplicateComponent}
            onEditButton={onEditButton}
            onEditSelectMenu={onEditSelectMenu}
            onOpenPaletteModal={onOpenPaletteModal}
            onContainerDragStart={handleContainerDragStart}
            onContainerDragOver={handleContainerDragOver}
            onContainerDrop={handleContainerDrop}
            onCompDragStart={(_e, c, comp) => setDraggedComp({ cIdx: c, compIdx: comp })}
            onCompDragOver={(_e, c, comp) => setDragOverComp({ cIdx: c, compIdx: comp })}
            onCompDrop={(_e, targetC, targetComp) => {
              if (draggedComp && (draggedComp.cIdx !== targetC || draggedComp.compIdx !== targetComp)) {
                // Handled in parent reducer
              }
              setDraggedComp(null);
              setDragOverComp(null);
            }}
            draggedComp={draggedComp}
            dragOverComp={dragOverComp}
          />
        ))}
      </div>
    </div>
  );
};
