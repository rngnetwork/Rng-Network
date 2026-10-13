'use client';

import React from 'react';
import {
  GripVertical,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  ComponentType,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
  type DiscordActionRowComponent,
  type DiscordSectionComponent,
  type DiscordMediaGalleryComponent,
  type DiscordSeparatorComponent,
} from '@/lib/model/embed';
import { Badge, type BadgeVariant } from '@/components/common/feedback/Badge';
import { TextDisplayNode } from './TextDisplayNode';
import { ActionRowGroup } from './ActionRowGroup';
import { SectionBlockNode } from './SectionBlockNode';
import { MediaGalleryNode } from './MediaGalleryNode';
import { SeparatorNode } from './SeparatorNode';

export interface ComponentItemRendererProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordInnerComponent;
  onUpdateComponent: (
    cIdx: number,
    compIdx: number,
    updated: DiscordInnerComponent
  ) => void;
  onRemoveComponent: (cIdx: number, compIdx: number) => void;
  onDuplicateComponent: (cIdx: number, compIdx: number) => void;
  onEditButton: (button: DiscordButtonComponent) => void;
  onEditSelectMenu: (select: DiscordStringSelectComponent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const TYPE_BADGES: Record<number, { name: string; variant: BadgeVariant }> = {
  1: { name: 'Action Row (Type 1)', variant: 'info' },
  2: { name: 'Button (Type 2)', variant: 'crimson' },
  3: { name: 'String Select (Type 3)', variant: 'info' },
  9: { name: 'Section (Type 9)', variant: 'warning' },
  10: { name: 'Text Display (Type 10)', variant: 'neutral' },
  12: { name: 'Media Gallery (Type 12)', variant: 'info' },
  14: { name: 'Separator (Type 14)', variant: 'neutral' },
};

export const ComponentItemRenderer: React.FC<ComponentItemRendererProps> = ({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onEditButton,
  onEditSelectMenu,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  isDragOver = false,
}) => {
  const badgeDef = TYPE_BADGES[comp.type] || {
    name: `Type ${comp.type}`,
    variant: 'neutral' as const,
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-apple-lg bg-surface-canvas border transition-all p-3.5 flex flex-col gap-3 ${
        isDragging
          ? 'opacity-40 border-dashed border-brand-red'
          : isDragOver
          ? 'border-brand-red bg-brand-red/5'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div
            title="Drag to reorder component"
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical size={14} />
          </div>
          <span className="text-xs font-bold text-white">#{compIdx + 1}</span>
          <Badge variant={badgeDef.variant} size="sm">
            {badgeDef.name}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDuplicateComponent(cIdx, compIdx)}
            title="Duplicate Component"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={() => onRemoveComponent(cIdx, compIdx)}
            title="Remove Component"
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div>
        {comp.type === ComponentType.TEXT_DISPLAY && (
          <TextDisplayNode
            node={comp}
            onChangeContent={(_id, content) =>
              onUpdateComponent(cIdx, compIdx, { ...comp, content })
            }
            onRemove={() => onRemoveComponent(cIdx, compIdx)}
          />
        )}

        {comp.type === ComponentType.ACTION_ROW && (
          <ActionRowGroup
            row={comp as DiscordActionRowComponent}
            onAddButtonToRow={() => {
              const currentComp = comp as DiscordActionRowComponent;
              if (currentComp.components.length < 5) {
                const newBtn: DiscordButtonComponent = {
                  type: ComponentType.BUTTON,
                  id: `btn_${Date.now()}`,
                  style: 1,
                  label: 'Button',
                  custom_id: `rng_act_${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}`,
                };
                onUpdateComponent(cIdx, compIdx, {
                  ...currentComp,
                  components: [...currentComp.components, newBtn],
                });
              }
            }}
            onEditButton={onEditButton}
            onEditSelectMenu={onEditSelectMenu}
            onRemoveChild={(childId) => {
              const currentComp = comp as DiscordActionRowComponent;
              onUpdateComponent(cIdx, compIdx, {
                ...currentComp,
                components: currentComp.components.filter((c) => c.id !== childId),
              });
            }}
            onRemoveRow={() => onRemoveComponent(cIdx, compIdx)}
          />
        )}

        {comp.type === ComponentType.SECTION && (
          <SectionBlockNode
            section={comp as DiscordSectionComponent}
            onUpdateSection={(_id, updates) =>
              onUpdateComponent(cIdx, compIdx, { ...comp, ...updates })
            }
            onRemove={() => onRemoveComponent(cIdx, compIdx)}
          />
        )}

        {comp.type === ComponentType.MEDIA_GALLERY && (
          <MediaGalleryNode
            gallery={comp as DiscordMediaGalleryComponent}
            onUpdateGallery={(_id, updates) =>
              onUpdateComponent(cIdx, compIdx, { ...comp, ...updates })
            }
            onRemove={() => onRemoveComponent(cIdx, compIdx)}
          />
        )}

        {comp.type === ComponentType.SEPARATOR && (
          <SeparatorNode
            separator={comp as DiscordSeparatorComponent}
            onUpdateSeparator={(_id, updates) =>
              onUpdateComponent(cIdx, compIdx, { ...comp, ...updates })
            }
            onRemove={() => onRemoveComponent(cIdx, compIdx)}
          />
        )}
      </div>
    </div>
  );
};
