'use client';

import React from 'react';
import { BuilderInternalSubNav, type BuilderSubTab } from './BuilderInternalSubNav';
import { BuilderBottomDockToolbar } from './BuilderBottomDockToolbar';

export interface MessageBuilderWorkspaceProps {
  activeSubTab: BuilderSubTab;
  onChangeSubTab: (tab: BuilderSubTab) => void;
  containerCount: number;
  totalComponents: number;
  // Bottom toolbar actions
  onAddContainer: () => void;
  onAddActionRow: () => void;
  onOpenPaletteModal: () => void;
  onOpenLoadModal: () => void;
  onClearCanvas: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenEmojiPicker: (e: React.MouseEvent<HTMLButtonElement>) => void;
  // Main canvas children
  children: React.ReactNode;
}

export const MessageBuilderWorkspace: React.FC<MessageBuilderWorkspaceProps> = ({
  activeSubTab,
  onChangeSubTab,
  containerCount,
  totalComponents,
  onAddContainer,
  onAddActionRow,
  onOpenPaletteModal,
  onOpenLoadModal,
  onClearCanvas,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenEmojiPicker,
  children,
}) => {
  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col relative overflow-hidden rounded-apple-2xl border border-white/10 bg-surface-canvas shadow-apple-card">
      {/* 1. Internal Sub-NavBar (Pinned at Top: sticky top-0 z-20) */}
      <BuilderInternalSubNav
        activeSubTab={activeSubTab}
        onChangeSubTab={onChangeSubTab}
        containerCount={containerCount}
        totalComponents={totalComponents}
      />

      {/* 2. Main Scrollable Canvas (Only this middle section scrolls) */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 [scrollbar-width:thin] focus:outline-none">
        {children}
      </main>

      {/* 3. Pinned Bottom Dock Toolbar (Pinned at Bottom: sticky bottom-0 z-30) */}
      <BuilderBottomDockToolbar
        onAddContainer={onAddContainer}
        onAddActionRow={onAddActionRow}
        onOpenPaletteModal={onOpenPaletteModal}
        onOpenLoadModal={onOpenLoadModal}
        onClearCanvas={onClearCanvas}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenEmojiPicker={onOpenEmojiPicker}
      />
    </div>
  );
};
