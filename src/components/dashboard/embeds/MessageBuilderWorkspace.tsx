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
    <div className="w-full flex-1 min-h-0 flex flex-col gap-3 relative overflow-hidden">
      {/* Tier 3: Sub Sub Nav (Detached standalone card with rounded corners) */}
      <BuilderInternalSubNav
        activeSubTab={activeSubTab}
        onChangeSubTab={onChangeSubTab}
        containerCount={containerCount}
        totalComponents={totalComponents}
      />

      {/* Tier 4: Builder Boxed Canvas (Standalone scrollable card with rounded corners: Scroll bar {yes}) */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 rounded-apple-2xl border border-white/10 bg-surface-card/60 shadow-apple-card [scrollbar-width:thin] focus:outline-none">
        {children}
      </main>

      {/* Tier 5: Bottom Dock (Detached standalone card with rounded corners) */}
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
