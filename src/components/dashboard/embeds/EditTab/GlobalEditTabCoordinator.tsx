'use client';

import React, { useState } from 'react';
import { Boxes, Plus } from 'lucide-react';
import {
  ComponentType,
  type Type17Container,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
} from '@/lib/model/embed';
import { Button } from '@/components/common/input/Button';
import { ContainerItemCard } from './ContainerItemCard';

export interface GlobalEditTabCoordinatorProps {
  messageContent?: string;
  containers: Type17Container[];
  onChangeMessageContent?: (content: string) => void;
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
    select: DiscordSelectComponent
  ) => void;
  onOpenPaletteModal: (cIdx: number) => void;
  onOpenEmojiPicker?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMoveComponent?: (containerIndex: number, fromIndex: number, toIndex: number) => void;
}

export const GlobalEditTabCoordinator: React.FC<
  GlobalEditTabCoordinatorProps
> = ({
  messageContent,
  containers,
  onChangeMessageContent,
  onAddContainer,
  onUpdateContainer,
  onRemoveContainer,
  onMoveContainer,
  onMoveComponent,
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
      {/* Containers List */}
      <div className="flex flex-col gap-5">
        {containers.length === 0 ? (
          <div className="p-8 rounded-apple-xl bg-surface-card border border-white/10 flex flex-col items-center justify-center text-center gap-3 shadow-apple-card">
            <div className="w-12 h-12 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red">
              <Boxes size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">No Containers Added</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Click below or &quot;+ Container&quot; in the bottom dock toolbar to start building your Discord Components V2 message layout.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={onAddContainer}
            >
              Add Container (Type 17)
            </Button>
          </div>
        ) : (
          containers.map((container, cIdx) => (
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
            onOpenEmojiPicker={onOpenEmojiPicker}
            onMoveComponent={(c, comp, dir) => {
              const targetComp = dir === 'up' ? comp - 1 : comp + 1;
              onMoveComponent?.(c, comp, targetComp);
            }}
            onContainerDragStart={handleContainerDragStart}
            onContainerDragOver={handleContainerDragOver}
            onContainerDrop={handleContainerDrop}
            onCompDragStart={(e, c, comp) => {
              setDraggedComp({ cIdx: c, compIdx: comp });
              e.dataTransfer.effectAllowed = 'move';
            }}
            onCompDragOver={(e, c, comp) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOverComp({ cIdx: c, compIdx: comp });
            }}
            onCompDrop={(e, targetC, targetComp) => {
              e.preventDefault();
              if (draggedComp && draggedComp.cIdx === targetC && draggedComp.compIdx !== targetComp) {
                onMoveComponent?.(targetC, draggedComp.compIdx, targetComp);
              }
              setDraggedComp(null);
              setDragOverComp(null);
            }}
            onCompDragEnd={() => {
              setDraggedComp(null);
              setDragOverComp(null);
            }}
            draggedComp={draggedComp}
            dragOverComp={dragOverComp}
          />
        )))}
      </div>
    </div>
  );
};
