'use client';

import React from 'react';
import { Sparkles, Layers, Box, AlignLeft, Image as ImageIcon, SlidersHorizontal, MousePointerClick } from 'lucide-react';
import { Modal } from '@/components/common/feedback/Modal';
import { Badge } from '@/components/common/feedback/Badge';
import { ComponentType } from '@/lib/model/embed';

export interface PaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (typeNum: ComponentType) => void;
}

interface ComponentItemDef {
  type: ComponentType;
  name: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
}

const LAYOUT_COMPONENTS: ComponentItemDef[] = [
  {
    type: ComponentType.ACTION_ROW,
    name: 'Action Row',
    badge: 'Type 1',
    desc: 'Horizontal container for up to 5 buttons or 1 select menu.',
    icon: <Layers size={16} className="text-blue-400" />,
  },
  {
    type: ComponentType.SECTION,
    name: 'Section',
    badge: 'Type 9',
    desc: 'Column-wise text blocks paired with an accessory (Thumbnail or Button).',
    icon: <Box size={16} className="text-amber-400" />,
  },
  {
    type: ComponentType.SEPARATOR,
    name: 'Separator',
    badge: 'Type 14',
    desc: 'Horizontal divider line with spacing rule between content blocks.',
    icon: <SlidersHorizontal size={16} className="text-zinc-400" />,
  },
  {
    type: ComponentType.MEDIA_GALLERY,
    name: 'Media Gallery',
    badge: 'Type 12',
    desc: 'Grid layout supporting up to 4 image attachments with spoiler toggle.',
    icon: <ImageIcon size={16} className="text-purple-400" />,
  },
];

const INTERACTIVE_COMPONENTS: ComponentItemDef[] = [
  {
    type: ComponentType.BUTTON,
    name: 'Button',
    badge: 'Type 2',
    desc: 'Clickable button (Primary, Secondary, Success, Danger, Link).',
    icon: <MousePointerClick size={16} className="text-brand-red" />,
  },
  {
    type: ComponentType.STRING_SELECT,
    name: 'String Select',
    badge: 'Type 3',
    desc: 'Interactive dropdown selector with custom options and emoji badges.',
    icon: <Layers size={16} className="text-cyan-400" />,
  },
  {
    type: ComponentType.USER_SELECT,
    name: 'User Select',
    badge: 'Type 5',
    desc: 'Discord user picker menu resolving guild members into session state.',
    icon: <Layers size={16} className="text-emerald-400" />,
  },
  {
    type: ComponentType.ROLE_SELECT,
    name: 'Role Select',
    badge: 'Type 6',
    desc: 'Dynamic Discord role selector adhering to role hierarchy invariants.',
    icon: <Layers size={16} className="text-yellow-400" />,
  },
];

const TEXT_COMPONENTS: ComponentItemDef[] = [
  {
    type: ComponentType.TEXT_DISPLAY,
    name: 'Text Display',
    badge: 'Type 10',
    desc: 'Discord markdown block supporting headings, quotes, code, and mentions.',
    icon: <AlignLeft size={16} className="text-zinc-300" />,
  },
];

export const PaletteModal: React.FC<PaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectComponent,
}) => {
  const handleSelect = (t: ComponentType) => {
    onSelectComponent(t);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insert Discord Component"
      size="xl"
    >
      <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Section 1: Layout & Containers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Message Layout & Containers
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LAYOUT_COMPONENTS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleSelect(item.type)}
                className="flex items-start gap-3 p-3.5 rounded-apple-xl bg-surface-card hover:bg-surface-elevated border border-white/10 hover:border-purple-500/40 transition-all text-left group cursor-pointer shadow-apple-card"
              >
                <div className="p-2 rounded-apple-md bg-white/[0.05] border border-white/10 group-hover:border-purple-500/30 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Interactive Controls */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MousePointerClick size={14} className="text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Interactive Controls
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTERACTIVE_COMPONENTS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleSelect(item.type)}
                className="flex items-start gap-3 p-3.5 rounded-apple-xl bg-surface-card hover:bg-surface-elevated border border-white/10 hover:border-cyan-500/40 transition-all text-left group cursor-pointer shadow-apple-card"
              >
                <div className="p-2 rounded-apple-md bg-white/[0.05] border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.name}
                    </span>
                    <Badge variant="info" size="sm">
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Text & Display */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlignLeft size={14} className="text-brand-red" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Text & Display Components
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEXT_COMPONENTS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleSelect(item.type)}
                className="flex items-start gap-3 p-3.5 rounded-apple-xl bg-surface-card hover:bg-surface-elevated border border-white/10 hover:border-brand-red/40 transition-all text-left group cursor-pointer shadow-apple-card"
              >
                <div className="p-2 rounded-apple-md bg-white/[0.05] border border-white/10 group-hover:border-brand-red/30 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                      {item.name}
                    </span>
                    <Badge variant="crimson" size="sm">
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
