'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PenLine, Eye, Code2, Send } from 'lucide-react';
import type { MessageBuilderState } from '@/lib/model/embed';

export type BuilderSubTab = MessageBuilderState['activeSubTab'];

export interface BuilderInternalSubNavProps {
  activeSubTab: BuilderSubTab;
  onChangeSubTab: (tab: BuilderSubTab) => void;
  containerCount: number;
  totalComponents: number;
}

export const BuilderInternalSubNav: React.FC<BuilderInternalSubNavProps> = ({
  activeSubTab,
  onChangeSubTab,
  containerCount,
  totalComponents,
}) => {
  return (
    <nav
      aria-label="Builder Workspace Views"
      className="shrink-0 w-full backdrop-blur-md bg-surface-card/90 border border-white/10 rounded-apple-xl px-2.5 py-1.5 sm:px-3 md:px-4 md:py-2 flex items-center justify-between gap-2 shadow-apple-card"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChangeSubTab('edit')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 text-xs font-semibold rounded-apple-md shrink-0 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'edit'
              ? 'text-white bg-blue-500/15 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <PenLine size={14} className={activeSubTab === 'edit' ? 'text-blue-400' : 'text-zinc-500'} />
          <span>Edit</span>
          {activeSubTab === 'edit' && (
            <motion.div
              layoutId="builderSubTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-1 left-2 right-2 h-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('preview')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 text-xs font-semibold rounded-apple-md shrink-0 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'preview'
              ? 'text-white bg-[#5865F2]/15 border border-[#5865F2]/30 shadow-[0_0_12px_rgba(88,101,242,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Eye size={14} className={activeSubTab === 'preview' ? 'text-[#7289da]' : 'text-zinc-500'} />
          <span>Preview</span>
          {activeSubTab === 'preview' && (
            <motion.div
              layoutId="builderSubTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-1 left-2 right-2 h-0.5 bg-[#5865F2] shadow-[0_0_8px_#5865F2]"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('raw')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 text-xs font-semibold rounded-apple-md shrink-0 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'raw'
              ? 'text-white bg-pink-500/15 border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Code2 size={14} className={activeSubTab === 'raw' ? 'text-pink-400' : 'text-zinc-500'} />
          <span>Raw</span>
          {activeSubTab === 'raw' && (
            <motion.div
              layoutId="builderSubTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-1 left-2 right-2 h-0.5 bg-pink-500 shadow-[0_0_8px_#ec4899]"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('dispatch')}
          className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 text-xs font-semibold rounded-apple-md shrink-0 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'dispatch'
              ? 'text-white bg-brand-red/15 border border-brand-red/30 shadow-[0_0_12px_rgba(225,29,46,0.25)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <Send size={14} className={activeSubTab === 'dispatch' ? 'text-brand-red' : 'text-zinc-500'} />
          <span>Dispatch</span>
          {activeSubTab === 'dispatch' && (
            <motion.div
              layoutId="builderSubTabIndicator"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute -bottom-1 left-2 right-2 h-0.5 bg-brand-red shadow-[0_0_8px_#ef4444]"
            />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-zinc-400 font-mono">
          {containerCount} Container{containerCount !== 1 ? 's' : ''} • {totalComponents} Component{totalComponents !== 1 ? 's' : ''}
        </span>
      </div>
    </nav>
  );
};
