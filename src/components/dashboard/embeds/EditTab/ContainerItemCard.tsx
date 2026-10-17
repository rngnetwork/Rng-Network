'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import {
  ComponentType,
  type Type17Container,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
} from '@/lib/model/embed';
import { TextInput } from '@/components/common/input/TextInput';
import { ContainerHeader } from './ContainerHeader';
import { ContainerFields } from './ContainerFields';
import { ComponentItemRenderer } from './ComponentItemRenderer';

export interface ContainerItemCardProps {
  cIdx: number;
  totalContainers: number;
  container: Type17Container;
  isAuthorCollapsed?: boolean;
  onUpdateAccent: (cIdx: number, color: string) => void;
  onToggleSpoiler: (cIdx: number) => void;
  onToggleAuthorCollapse: (cIdx: number) => void;
  onMoveContainer: (cIdx: number, direction: 'up' | 'down') => void;
  onRemoveContainer: (cIdx: number) => void;
  onUpdateContainer: (
    cIdx: number,
    updates: Partial<Type17Container>
  ) => void;
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
  // Drag and drop handlers
  onContainerDragStart?: (e: React.DragEvent, cIdx: number) => void;
  onContainerDragOver?: (e: React.DragEvent, cIdx: number) => void;
  onContainerDrop?: (e: React.DragEvent, cIdx: number) => void;
  onCompDragStart?: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  onCompDragOver?: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  onCompDrop?: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  draggedComp?: { cIdx: number; compIdx: number } | null;
  dragOverComp?: { cIdx: number; compIdx: number } | null;
}

export const ContainerItemCard: React.FC<ContainerItemCardProps> = ({
  cIdx,
  totalContainers,
  container,
  isAuthorCollapsed = false,
  onUpdateAccent,
  onToggleSpoiler,
  onToggleAuthorCollapse,
  onMoveContainer,
  onRemoveContainer,
  onUpdateContainer,
  onUpdateAuthor,
  onUpdateFooter,
  onAddField,
  onUpdateField,
  onRemoveField,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onEditButton,
  onEditSelectMenu,
  onOpenPaletteModal,
  onContainerDragStart,
  onContainerDragOver,
  onContainerDrop,
  onCompDragStart,
  onCompDragOver,
  onCompDrop,
  draggedComp,
  dragOverComp,
}) => {
  return (
    <div
      onDragOver={(e) => onContainerDragOver?.(e, cIdx)}
      onDrop={(e) => onContainerDrop?.(e, cIdx)}
      style={{
        borderLeftColor: container.accentColor || '#E11D2E',
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.36), 0 0 16px ${container.accentColor || '#E11D2E'}15`,
      }}
      className="rounded-apple-xl bg-surface-card/90 backdrop-blur-xl border border-white/10 border-l-4 p-5 flex flex-col gap-4 shadow-apple-card transition-all"
    >
      {/* 1. Container Header */}
      <ContainerHeader
        cIdx={cIdx}
        totalContainers={totalContainers}
        accentColor={container.accentColor}
        isSpoiler={container.isSpoiler}
        isAuthorCollapsed={isAuthorCollapsed}
        onUpdateAccent={onUpdateAccent}
        onToggleSpoiler={onToggleSpoiler}
        onToggleAuthorCollapse={onToggleAuthorCollapse}
        onMoveContainer={onMoveContainer}
        onRemoveContainer={onRemoveContainer}
        onDragStart={(e) => onContainerDragStart?.(e, cIdx)}
      />

      {/* 2. Optional Author Bar */}
      {!isAuthorCollapsed && (
        <TextInput
          placeholder="Author Name (e.g. Server Announcements)"
          value={container.author?.name || ''}
          onChange={(e) => onUpdateAuthor(cIdx, 'name', e.target.value)}
          leftIcon={<span className="text-zinc-500 text-xs font-mono">@</span>}
        />
      )}

      {/* 3. Title & Description */}
      <div className="flex flex-col gap-3">
        <TextInput
          label="Container Title"
          placeholder="Container Title (e.g. Welcome & Rules)"
          value={container.title || ''}
          onChange={(e) =>
            onUpdateContainer(cIdx, { title: e.target.value })
          }
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Container Description / Body (Markdown)
          </label>
          <textarea
            value={container.description || ''}
            rows={2}
            placeholder="Container Description / Body Markdown text..."
            onChange={(e) =>
              onUpdateContainer(cIdx, { description: e.target.value })
            }
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-[#0E0E12] border border-surface-border hover:border-white/20 focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-xs sm:text-sm text-white font-sans outline-none transition-all resize-y leading-relaxed"
          />
        </div>
      </div>

      {/* 4. Embed Fields */}
      <ContainerFields
        cIdx={cIdx}
        fields={container.fields}
        onAddField={onAddField}
        onUpdateField={onUpdateField}
        onRemoveField={onRemoveField}
      />

      {/* 5. Nested Components List */}
      <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.08]">
        {container.components.length === 0 ? (
          <div className="py-4 rounded-apple-lg border border-dashed border-white/10 text-center text-xs text-zinc-500">
            No inner components yet. Click &quot;+ UI Components&quot; in the bottom toolbar to add buttons, sections, etc.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {container.components.map((comp, compIdx) => (
              <ComponentItemRenderer
                key={comp.id || `comp_${compIdx}`}
                cIdx={cIdx}
                compIdx={compIdx}
                comp={comp}
                onUpdateComponent={onUpdateComponent}
                onRemoveComponent={onRemoveComponent}
                onDuplicateComponent={onDuplicateComponent}
                onEditButton={(btn) => onEditButton(cIdx, btn)}
                onEditSelectMenu={(sel) => onEditSelectMenu(cIdx, sel)}
                onDragStart={(e) => onCompDragStart?.(e, cIdx, compIdx)}
                onDragOver={(e) => onCompDragOver?.(e, cIdx, compIdx)}
                onDrop={(e) => onCompDrop?.(e, cIdx, compIdx)}
                isDragging={
                  draggedComp?.cIdx === cIdx && draggedComp?.compIdx === compIdx
                }
                isDragOver={
                  dragOverComp?.cIdx === cIdx && dragOverComp?.compIdx === compIdx
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* 7. Footer Subtext (Strictly positioned at container bottom) */}
      <TextInput
        placeholder="Footer Text"
        value={container.footer?.text || ''}
        onChange={(e) => onUpdateFooter(cIdx, 'text', e.target.value)}
        leftIcon={<Calendar size={14} className="text-zinc-500 shrink-0" />}
      />
    </div>
  );
};
