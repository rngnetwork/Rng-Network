'use client';

import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import {
  ComponentType,
  type Type17Container,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
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
    select: DiscordStringSelectComponent
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
      style={{ borderLeftColor: container.accentColor || '#E11D2E' }}
      className="rounded-apple-xl bg-surface-card border border-white/10 border-l-4 p-5 flex flex-col gap-4 shadow-apple-card transition-all"
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
        <div className="p-3 rounded-apple-lg bg-surface-canvas border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Author Name
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-apple-md bg-black/40 border border-white/10 focus-within:border-brand-red transition-colors">
              <span className="text-zinc-500 text-xs font-mono">@</span>
              <input
                type="text"
                value={container.author?.name || ''}
                placeholder="Author Name (e.g. Server Announcements)"
                onChange={(e) => onUpdateAuthor(cIdx, 'name', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none font-sans"
              />
            </div>
          </div>

          <TextInput
            label="Author Icon URL"
            placeholder="https://..."
            value={container.author?.icon_url || ''}
            onChange={(e) => onUpdateAuthor(cIdx, 'icon_url', e.target.value)}
          />
        </div>
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
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/50 border border-white/10 focus:border-brand-red text-xs sm:text-sm text-white font-sans outline-none transition-colors resize-y leading-relaxed"
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

      {/* 5. Optional Thumbnail & Image Banner */}
      {!isAuthorCollapsed && (
        <div className="p-3 rounded-apple-lg bg-surface-canvas border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Thumbnail URL"
            placeholder="Square icon URL..."
            value={container.thumbnail || ''}
            onChange={(e) =>
              onUpdateContainer(cIdx, { thumbnail: e.target.value })
            }
          />
          <TextInput
            label="Large Image / Banner URL"
            placeholder="Banner image URL..."
            value={container.image || ''}
            onChange={(e) =>
              onUpdateContainer(cIdx, { image: e.target.value })
            }
          />
        </div>
      )}

      {/* 6. Nested Components List */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400">
            Components ({container.components.length}/30)
          </span>
          <button
            type="button"
            onClick={() => onOpenPaletteModal(cIdx)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-apple-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Component</span>
          </button>
        </div>

        {container.components.length === 0 ? (
          <div className="py-6 rounded-apple-lg border border-dashed border-white/10 text-center text-xs text-zinc-500">
            No inner components yet. Click "Add Component" above or use the bottom toolbar.
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
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-apple-md bg-white/[0.02] border border-dashed border-white/10 mt-1">
        <Calendar size={14} className="text-zinc-500 shrink-0" />
        <input
          type="text"
          value={container.footer?.text || ''}
          placeholder="Footer Text"
          onChange={(e) => onUpdateFooter(cIdx, 'text', e.target.value)}
          className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-500 outline-none font-sans"
        />
      </div>
    </div>
  );
};
