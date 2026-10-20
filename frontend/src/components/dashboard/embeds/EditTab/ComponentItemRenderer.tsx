'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  Copy,
  Trash2,
  Settings2,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
} from 'lucide-react';
import {
  ComponentType,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
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
import { SectionConfigModal } from '../modals/SectionConfigModal';
import { SeparatorConfigModal } from '../modals/SeparatorConfigModal';
import { MediaGalleryConfigModal } from '../modals/MediaGalleryConfigModal';

export interface ComponentItemRendererProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordInnerComponent;
  totalComponents?: number;
  onMoveComponent?: (cIdx: number, compIdx: number, direction: 'up' | 'down') => void;
  onUpdateComponent: (
    cIdx: number,
    compIdx: number,
    updated: DiscordInnerComponent
  ) => void;
  onRemoveComponent: (cIdx: number, compIdx: number) => void;
  onDuplicateComponent: (cIdx: number, compIdx: number) => void;
  onEditButton: (button: DiscordButtonComponent) => void;
  onEditSelectMenu: (select: DiscordSelectComponent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onOpenEmojiPicker?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const TYPE_BADGES: Record<number, { name: string; variant: BadgeVariant }> = {
  1: { name: 'Action Row (Type 1)', variant: 'info' },
  2: { name: 'Button (Type 2)', variant: 'crimson' },
  3: { name: 'String Select (Type 3)', variant: 'info' },
  5: { name: 'User Select (Type 5)', variant: 'info' },
  6: { name: 'Role Select (Type 6)', variant: 'warning' },
  7: { name: 'Mentionable Select (Type 7)', variant: 'info' },
  8: { name: 'Channel Select (Type 8)', variant: 'info' },
  9: { name: 'Section (Type 9)', variant: 'warning' },
  10: { name: 'Text Display (Type 10)', variant: 'neutral' },
  12: { name: 'Media Gallery (Type 12)', variant: 'info' },
  14: { name: 'Separator (Type 14)', variant: 'neutral' },
};

export const ComponentItemRenderer: React.FC<ComponentItemRendererProps> = ({
  cIdx,
  compIdx,
  comp,
  totalComponents = 1,
  onMoveComponent,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onEditButton,
  onEditSelectMenu,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onOpenEmojiPicker,
  isDragging = false,
  isDragOver = false,
}) => {
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSeparatorModalOpen, setIsSeparatorModalOpen] = useState(false);
  const [isMediaGalleryModalOpen, setIsMediaGalleryModalOpen] = useState(false);

  const badgeDef = TYPE_BADGES[comp.type] || {
    name: `Type ${comp.type}`,
    variant: 'neutral' as const,
  };

  const isSelectMenu =
    comp.type === ComponentType.STRING_SELECT ||
    comp.type === ComponentType.USER_SELECT ||
    comp.type === ComponentType.ROLE_SELECT ||
    comp.type === ComponentType.MENTIONABLE_SELECT ||
    comp.type === ComponentType.CHANNEL_SELECT;

  const childSelectMenu =
    comp.type === ComponentType.ACTION_ROW && 'components' in comp
      ? (comp as DiscordActionRowComponent).components?.find(
          (c) =>
            c.type === ComponentType.STRING_SELECT ||
            c.type === ComponentType.USER_SELECT ||
            c.type === ComponentType.ROLE_SELECT ||
            c.type === ComponentType.MENTIONABLE_SELECT ||
            c.type === ComponentType.CHANNEL_SELECT
        ) as DiscordSelectComponent | undefined
      : undefined;

  const hasSettings =
    comp.type === ComponentType.SECTION ||
    comp.type === ComponentType.SEPARATOR ||
    comp.type === ComponentType.MEDIA_GALLERY ||
    isSelectMenu ||
    Boolean(childSelectMenu);

  const handleOpenSettings = () => {
    if (comp.type === ComponentType.SECTION) {
      setIsSectionModalOpen(true);
    } else if (comp.type === ComponentType.SEPARATOR) {
      setIsSeparatorModalOpen(true);
    } else if (comp.type === ComponentType.MEDIA_GALLERY) {
      setIsMediaGalleryModalOpen(true);
    } else if (isSelectMenu) {
      onEditSelectMenu(comp as DiscordSelectComponent);
    } else if (childSelectMenu) {
      onEditSelectMenu(childSelectMenu);
    }
  };

  return (
    <>
      <div
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
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              title="Drag to reorder component"
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical size={14} />
            </div>
            {onMoveComponent && (
              <div className="flex items-center border border-white/10 rounded-apple-md overflow-hidden">
                <button
                  type="button"
                  disabled={compIdx === 0}
                  onClick={() => onMoveComponent(cIdx, compIdx, 'up')}
                  title="Move component up"
                  className="p-1 text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={compIdx === totalComponents - 1}
                  onClick={() => onMoveComponent(cIdx, compIdx, 'down')}
                  title="Move component down"
                  className="p-1 text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-white/10"
                >
                  <ChevronDown size={13} />
                </button>
              </div>
            )}
            <span className="text-xs font-bold text-white">#{compIdx + 1}</span>
            <Badge variant={badgeDef.variant} size="sm">
              {badgeDef.name}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {hasSettings && (
              <button
                type="button"
                onClick={handleOpenSettings}
                title="Component Settings"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Settings2 size={13} />
              </button>
            )}
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
              onUpdateRowComponents={(updatedComponents) => {
                const currentComp = comp as DiscordActionRowComponent;
                onUpdateComponent(cIdx, compIdx, {
                  ...currentComp,
                  components: updatedComponents,
                });
              }}
            />
          )}

          {isSelectMenu && (
            <div
              onClick={() => onEditSelectMenu(comp as DiscordSelectComponent)}
              className="group flex flex-col gap-2 cursor-pointer"
            >
              <div className="flex items-center justify-between p-2.5 rounded-apple-md bg-black/40 border border-white/10 group-hover:border-brand-red/40 transition-colors">
                <span className="text-xs text-zinc-300 font-medium">
                  {(comp as DiscordSelectComponent).placeholder || 'Select an option...'}
                </span>
                <div className="flex items-center gap-2 text-zinc-500">
                  {'options' in comp && Array.isArray((comp as DiscordStringSelectComponent).options) && (
                    <span className="text-[10px] text-zinc-400">
                      ({(comp as DiscordStringSelectComponent).options.length} options)
                    </span>
                  )}
                  <ChevronDown size={14} />
                </div>
              </div>

              {'options' in comp &&
                Array.isArray((comp as DiscordStringSelectComponent).options) &&
                (comp as DiscordStringSelectComponent).options.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(comp as DiscordStringSelectComponent).options.map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 border border-white/10 text-[11px] text-zinc-300"
                      >
                        {opt.emoji && (
                          <span className="text-xs">
                            {typeof opt.emoji === 'string' ? opt.emoji : opt.emoji.name}
                          </span>
                        )}
                        <span>{opt.label || `Option ${oIdx + 1}`}</span>
                      </span>
                    ))}
                  </div>
                )}

              {comp.type === ComponentType.STRING_SELECT && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-white/5 text-[10.5px] text-zinc-400">
                  <MousePointerClick size={11} className="text-amber-400" />
                  <span>
                    {(comp as DiscordStringSelectComponent).invokerButtonId
                      ? 'Action invokes on mapped button click'
                      : 'Mapped button click required to invoke action'}
                  </span>
                </div>
              )}
            </div>
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

      {comp.type === ComponentType.SECTION && (
        <SectionConfigModal
          isOpen={isSectionModalOpen}
          section={comp as DiscordSectionComponent}
          onClose={() => setIsSectionModalOpen(false)}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
          onOpenEmojiPicker={onOpenEmojiPicker}
        />
      )}

      {comp.type === ComponentType.SEPARATOR && (
        <SeparatorConfigModal
          isOpen={isSeparatorModalOpen}
          separator={comp as DiscordSeparatorComponent}
          onClose={() => setIsSeparatorModalOpen(false)}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
        />
      )}

      {comp.type === ComponentType.MEDIA_GALLERY && (
        <MediaGalleryConfigModal
          isOpen={isMediaGalleryModalOpen}
          gallery={comp as DiscordMediaGalleryComponent}
          onClose={() => setIsMediaGalleryModalOpen(false)}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
        />
      )}
    </>
  );
};
