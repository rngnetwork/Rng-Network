'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  PenTool,
  Eye,
  Send,
  Code2,
  Bookmark,
} from 'lucide-react';
import type { MessageBuilderState } from '@/lib/model/embed';

export interface GlobalModeSwitcherProps {
  activeTab: MessageBuilderState['activeSubTab'];
  onChangeTab: (tab: MessageBuilderState['activeSubTab']) => void;
  templateCount?: number;
  violationCount?: number;
}

interface ModeItem {
  id: MessageBuilderState['activeSubTab'];
  label: string;
  icon: React.ReactNode;
}

const MODE_ITEMS: ModeItem[] = [
  { id: 'edit', label: 'Edit Layout', icon: <PenTool size={15} /> },
  { id: 'preview', label: 'Live Preview', icon: <Eye size={15} /> },
  { id: 'dispatch', label: 'Dispatch', icon: <Send size={15} /> },
  { id: 'raw', label: 'Raw JSON', icon: <Code2 size={15} /> },
  { id: 'templates', label: 'Templates', icon: <Bookmark size={15} /> },
];

export const GlobalModeSwitcher: React.FC<GlobalModeSwitcherProps> = ({
  activeTab,
  onChangeTab,
  templateCount,
  violationCount = 0,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Embed Builder Workspace Modes"
      className="inline-flex items-center p-1 rounded-apple-lg bg-zinc-900/90 border border-white/[0.08] backdrop-blur-md overflow-x-auto max-w-full"
    >
      {MODE_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChangeTab(item.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2 min-h-[44px] sm:min-h-[36px] rounded-apple-md text-xs font-semibold transition-colors whitespace-nowrap select-none ${
              isActive
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="embed-mode-pill"
                className="absolute inset-0 rounded-apple-md bg-brand-red/90 shadow-crimson-glow -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'templates' && typeof templateCount === 'number' && (
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                  isActive
                    ? 'bg-black/30 text-white'
                    : 'bg-white/[0.06] text-zinc-400'
                }`}
              >
                {templateCount}
              </span>
            )}
            {item.id === 'dispatch' && violationCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {violationCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
