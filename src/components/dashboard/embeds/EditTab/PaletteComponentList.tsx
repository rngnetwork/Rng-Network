'use client';

import React from 'react';
import {
  Type,
  MousePointerClick,
  ListChecks,
  Columns,
  Image as ImageIcon,
  Minus,
  PlusSquare,
} from 'lucide-react';
import { ComponentType } from '@/lib/model/embed';
import { Button } from '@/components/common/input/Button';

export interface PaletteComponentListProps {
  onAddComponent: (componentType: ComponentType) => void;
  onAddContainer: () => void;
  containerCount: number;
  disabled?: boolean;
}

interface PaletteDescriptor {
  type: ComponentType;
  label: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteDescriptor[] = [
  {
    type: ComponentType.TEXT_DISPLAY,
    label: 'Text Display',
    badge: 'Type 10',
    description: 'Markdown-formatted content block',
    icon: <Type size={16} className="text-brand-red" />,
  },
  {
    type: ComponentType.BUTTON,
    label: 'Interactive Button',
    badge: 'Type 2',
    description: 'Auto-packs into Action Row (max 5)',
    icon: <MousePointerClick size={16} className="text-brand-red" />,
  },
  {
    type: ComponentType.STRING_SELECT,
    label: 'Select Menu',
    badge: 'Type 3',
    description: 'Dropdown with custom options & actions',
    icon: <ListChecks size={16} className="text-brand-red" />,
  },
  {
    type: ComponentType.SECTION,
    label: 'Section Block',
    badge: 'Type 9',
    description: 'Text column paired with accessory',
    icon: <Columns size={16} className="text-brand-red" />,
  },
  {
    type: ComponentType.MEDIA_GALLERY,
    label: 'Media Gallery',
    badge: 'Type 12',
    description: 'Grid layout for up to 4 media URLs',
    icon: <ImageIcon size={16} className="text-brand-red" />,
  },
  {
    type: ComponentType.SEPARATOR,
    label: 'Separator Rule',
    badge: 'Type 14',
    description: 'Horizontal divider with spacing',
    icon: <Minus size={16} className="text-brand-red" />,
  },
];

export const PaletteComponentList: React.FC<PaletteComponentListProps> = ({
  onAddComponent,
  onAddContainer,
  containerCount,
  disabled = false,
}) => {
  return (
    <div className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
            Components V2 Palette
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Insert blocks into the active Type 17 container
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || containerCount >= 10}
          leftIcon={<PlusSquare size={14} />}
          onClick={onAddContainer}
        >
          New Container ({containerCount}/10)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {PALETTE_ITEMS.map((item) => (
          <button
            key={item.type}
            type="button"
            disabled={disabled}
            onClick={() => onAddComponent(item.type)}
            className="flex items-start gap-3 p-3 min-h-[44px] rounded-apple-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-brand-red/40 text-left transition-all group disabled:opacity-40 disabled:pointer-events-none"
          >
            <div className="p-2 rounded-apple-md bg-brand-red/10 border border-brand-red/20 shrink-0 group-hover:scale-105 transition-transform">
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400 shrink-0">
                  {item.badge}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                {item.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
