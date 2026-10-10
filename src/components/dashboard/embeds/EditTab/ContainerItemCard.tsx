'use client';

import React from 'react';
import { Trash2, Layers } from 'lucide-react';
import {
  ComponentType,
  type Type17Container,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
} from '@/lib/model/embed';
import { ColorPicker } from '@/components/common/input/ColorPicker';
import { TextInput } from '@/components/common/input/TextInput';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Badge } from '@/components/common/feedback/Badge';
import { TextDisplayNode } from './TextDisplayNode';
import { ActionRowGroup } from './ActionRowGroup';
import { SectionBlockNode } from './SectionBlockNode';
import { MediaGalleryNode } from './MediaGalleryNode';
import { SeparatorNode } from './SeparatorNode';

export interface ContainerItemCardProps {
  container: Type17Container;
  index: number;
  isSelected: boolean;
  canRemove: boolean;
  onSelect: (containerId: string) => void;
  onUpdateContainer: (
    containerId: string,
    updates: Partial<Type17Container>
  ) => void;
  onRemoveContainer: (containerId: string) => void;
  onAddComponent: (containerId: string, componentType: ComponentType) => void;
  onUpdateComponent: (
    containerId: string,
    componentId: string,
    updates: Partial<DiscordInnerComponent>
  ) => void;
  onRemoveComponent: (containerId: string, componentId: string) => void;
  onEditButton: (containerId: string, button: DiscordButtonComponent) => void;
  onEditSelectMenu: (
    containerId: string,
    select: DiscordStringSelectComponent
  ) => void;
}

const ContainerItemCardInner: React.FC<ContainerItemCardProps> = ({
  container,
  index,
  isSelected,
  canRemove,
  onSelect,
  onUpdateContainer,
  onRemoveContainer,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
  onEditButton,
  onEditSelectMenu,
}) => {
  return (
    <div
      onClick={() => onSelect(container.id)}
      style={{ borderLeftColor: container.accentColor || '#E11D2E' }}
      className={`rounded-apple-xl bg-surface-card border border-l-4 transition-all p-5 flex flex-col gap-5 ${
        isSelected
          ? 'border-white/20 shadow-apple-card'
          : 'border-white/[0.08] hover:border-white/15'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Container #{index + 1}
              </span>
              <Badge variant="crimson" size="sm">
                Type 17
              </Badge>
              {isSelected && (
                <Badge variant="success" size="sm">
                  Active Target
                </Badge>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {container.components.length}/30 nested components
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ToggleSwitch
            size="sm"
            checked={Boolean(container.isSpoiler)}
            onChange={(checked) =>
              onUpdateContainer(container.id, { isSpoiler: checked })
            }
            label="Spoiler Blur"
          />

          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveContainer(container.id);
              }}
              aria-label={`Remove Container ${index + 1}`}
              className="p-2 rounded-apple-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Container Header Title"
            value={container.title ?? ''}
            onChange={(e) =>
              onUpdateContainer(container.id, { title: e.target.value })
            }
            placeholder="Operational Briefing..."
          />
          <TextInput
            label="Container Subtitle / Lead"
            value={container.description ?? ''}
            onChange={(e) =>
              onUpdateContainer(container.id, { description: e.target.value })
            }
            placeholder="Summary description..."
          />
        </div>

        <div>
          <ColorPicker
            label="Accent Bar Color"
            color={container.accentColor || '#E11D2E'}
            onChange={(hex) =>
              onUpdateContainer(container.id, { accentColor: hex })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {container.components.length === 0 ? (
          <div className="py-6 px-4 rounded-apple-lg bg-black/30 border border-dashed border-white/10 text-center text-xs text-zinc-500">
            No nested components inside this Type 17 container. Use the palette above to insert blocks.
          </div>
        ) : (
          container.components.map((comp, cIdx) => {
            const key = comp.id || `comp_${cIdx}`;
            if (comp.type === ComponentType.TEXT_DISPLAY) {
              return (
                <TextDisplayNode
                  key={key}
                  node={comp}
                  onChangeContent={(compId, content) =>
                    onUpdateComponent(container.id, compId, { content })
                  }
                  onRemove={(compId) => onRemoveComponent(container.id, compId)}
                />
              );
            }
            if (comp.type === ComponentType.ACTION_ROW) {
              return (
                <ActionRowGroup
                  key={key}
                  row={comp}
                  onAddButtonToRow={() =>
                    onAddComponent(container.id, ComponentType.BUTTON)
                  }
                  onEditButton={(btn) => onEditButton(container.id, btn)}
                  onEditSelectMenu={(sel) => onEditSelectMenu(container.id, sel)}
                  onRemoveChild={(childId) =>
                    onRemoveComponent(container.id, childId)
                  }
                  onRemoveRow={(rowId) =>
                    onRemoveComponent(container.id, rowId)
                  }
                />
              );
            }
            if (comp.type === ComponentType.SECTION) {
              return (
                <SectionBlockNode
                  key={key}
                  section={comp}
                  onUpdateSection={(compId, updates) =>
                    onUpdateComponent(container.id, compId, updates)
                  }
                  onRemove={(compId) => onRemoveComponent(container.id, compId)}
                />
              );
            }
            if (comp.type === ComponentType.MEDIA_GALLERY) {
              return (
                <MediaGalleryNode
                  key={key}
                  gallery={comp}
                  onUpdateGallery={(compId, updates) =>
                    onUpdateComponent(container.id, compId, updates)
                  }
                  onRemove={(compId) => onRemoveComponent(container.id, compId)}
                />
              );
            }
            if (comp.type === ComponentType.SEPARATOR) {
              return (
                <SeparatorNode
                  key={key}
                  separator={comp}
                  onUpdateSeparator={(compId, updates) =>
                    onUpdateComponent(container.id, compId, updates)
                  }
                  onRemove={(compId) => onRemoveComponent(container.id, compId)}
                />
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
};

export const ContainerItemCard = React.memo(ContainerItemCardInner);
