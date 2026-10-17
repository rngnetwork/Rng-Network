'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Boxes, Bookmark, Zap } from 'lucide-react';

export type EmbedBuilderTopTab = 'builder' | 'templates' | 'actions';

export interface EmbedBuilderTopNavBarProps {
  activeTab: EmbedBuilderTopTab;
  onChangeTab: (tab: EmbedBuilderTopTab) => void;
  templateCount?: number;
  actionCount?: number;
}

export const EmbedBuilderTopNavBar: React.FC<EmbedBuilderTopNavBarProps> = ({
  activeTab,
  onChangeTab,
  templateCount,
  actionCount,
}) => {
  return (
    <header className="relative w-full backdrop-blur-md bg-surface-card/90 border border-white/10 rounded-apple-xl px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-between shrink-0 shadow-apple-card">
      <nav
        aria-label="Embed Builder Primary Navigation"
        className="flex items-center gap-1.5 md:gap-2 overflow-x-auto overflow-y-hidden w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={() => onChangeTab('builder')}
          className={`relative flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-apple-xl transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'builder'
              ? 'text-white bg-brand-red/10 border border-brand-red/30 shadow-[0_0_15px_rgba(225,29,46,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Boxes
            size={16}
            className={activeTab === 'builder' ? 'text-brand-red' : 'text-zinc-500'}
          />
          <span>Message Builder</span>
          {activeTab === 'builder' && (
            <motion.div
              layoutId="embedTopActiveTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-2 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('templates')}
          className={`relative flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-apple-xl transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'templates'
              ? 'text-white bg-brand-red/10 border border-brand-red/30 shadow-[0_0_15px_rgba(225,29,46,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Bookmark
            size={16}
            className={activeTab === 'templates' ? 'text-amber-400' : 'text-zinc-500'}
          />
          <span>Templates</span>
          {typeof templateCount === 'number' && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {templateCount}
            </span>
          )}
          {activeTab === 'templates' && (
            <motion.div
              layoutId="embedTopActiveTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-2 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('actions')}
          className={`relative flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-apple-xl transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === 'actions'
              ? 'text-white bg-brand-red/10 border border-brand-red/30 shadow-[0_0_15px_rgba(225,29,46,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Zap
            size={16}
            className={activeTab === 'actions' ? 'text-cyan-400' : 'text-zinc-500'}
          />
          <span>Action Templates</span>
          {typeof actionCount === 'number' && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300">
              {actionCount}
            </span>
          )}
          {activeTab === 'actions' && (
            <motion.div
              layoutId="embedTopActiveTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-2 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
            />
          )}
        </button>
      </nav>
    </header>
  );
};
