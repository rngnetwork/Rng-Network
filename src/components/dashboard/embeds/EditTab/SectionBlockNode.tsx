'use client';

import React from 'react';
import { Columns, Trash2, Image as ImageIcon, MousePointerClick } from 'lucide-react';
import {
  ComponentType,
  type DiscordSectionComponent,
  type DiscordThumbnailComponent,
  type DiscordButtonComponent,
} from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { TextInput } from '@/components/common/input/TextInput';

export interface SectionBlockNodeProps {
  section: DiscordSectionComponent;
  onUpdateSection: (
    componentId: string,
    updates: Partial<DiscordSectionComponent>
  ) => void;
  onRemove: (componentId: string) => void;
}

const SectionBlockNodeInner: React.FC<SectionBlockNodeProps> = ({
  section,
  onUpdateSection,
  onRemove,
}) => {
  const componentId = section.id || '';
  const primaryText = section.components[0]?.content ?? section.text ?? '';
  const isThumbnailAccessory =
    section.accessory &&
    (section.accessory.type === ComponentType.THUMBNAIL ||
      section.accessory.type === 'thumbnail');

  const thumbnailUrl = isThumbnailAccessory
    ? (section.accessory as DiscordThumbnailComponent).media_url ||
      (section.accessory as DiscordThumbnailComponent).url ||
      ''
    : '';

  const buttonAccessory =
    !isThumbnailAccessory && section.accessory
      ? (section.accessory as DiscordButtonComponent)
      : null;

  const handleTextChange = (value: string) => {
    onUpdateSection(componentId, {
      components: [
        {
          type: ComponentType.TEXT_DISPLAY,
          id: section.components[0]?.id || `${componentId}_txt`,
          content: value,
        },
      ],
    });
  };

  const handleSwitchAccessoryType = (targetType: 'thumbnail' | 'button') => {
    if (targetType === 'thumbnail') {
      onUpdateSection(componentId, {
        accessory: {
          type: ComponentType.THUMBNAIL,
          media_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
          description: 'Section Thumbnail',
        },
      });
    } else {
      onUpdateSection(componentId, {
        accessory: {
          type: ComponentType.BUTTON,
          style: 2,
          label: 'Action',
          custom_id: 'rng_act_0000000000000001',
        },
      });
    }
  };

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Columns size={14} className="text-brand-red" />
          <Badge variant="neutral" size="sm">
            Section Block (Type 9)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-apple-sm bg-black/50 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => handleSwitchAccessoryType('button')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                !isThumbnailAccessory
                  ? 'bg-brand-red text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MousePointerClick size={11} />
              <span>Button</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAccessoryType('thumbnail')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                isThumbnailAccessory
                  ? 'bg-brand-red text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon size={11} />
              <span>Thumbnail</span>
            </button>
          </div>

          {componentId && (
            <button
              type="button"
              onClick={() => onRemove(componentId)}
              aria-label="Remove Section Block"
              className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <textarea
            value={primaryText}
            rows={3}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Section column text..."
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/50 border border-white/10 focus:border-brand-red text-xs sm:text-sm text-white outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-2 justify-center p-3 rounded-apple-md bg-black/40 border border-white/[0.06]">
          {isThumbnailAccessory ? (
            <TextInput
              label="Thumbnail URL (Type 11)"
              value={thumbnailUrl}
              onChange={(e) =>
                onUpdateSection(componentId, {
                  accessory: {
                    type: ComponentType.THUMBNAIL,
                    media_url: e.target.value,
                  },
                })
              }
              placeholder="https://..."
            />
          ) : (
            <div className="flex flex-col gap-2">
              <TextInput
                label="Accessory Button Label"
                value={buttonAccessory?.label ?? 'Acknowledge'}
                onChange={(e) =>
                  onUpdateSection(componentId, {
                    accessory: {
                      type: ComponentType.BUTTON,
                      style: buttonAccessory?.style ?? 2,
                      label: e.target.value,
                      custom_id:
                        buttonAccessory?.custom_id ?? 'rng_act_0000000000000001',
                    },
                  })
                }
              />
              <TextInput
                label="Action ID (rng_act_*)"
                value={buttonAccessory?.custom_id ?? ''}
                onChange={(e) =>
                  onUpdateSection(componentId, {
                    accessory: {
                      type: ComponentType.BUTTON,
                      style: buttonAccessory?.style ?? 2,
                      label: buttonAccessory?.label ?? 'Acknowledge',
                      custom_id: e.target.value,
                    },
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SectionBlockNode = React.memo(SectionBlockNodeInner);
