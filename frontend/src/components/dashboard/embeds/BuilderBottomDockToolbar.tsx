'use client';

import React from 'react';
import {
  Plus,
  Layers,
  Sparkles,
  FolderOpen,
  Trash2,
  Undo2,
  Redo2,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/common/input/Button';

export interface BuilderBottomDockToolbarProps {
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
}

export const BuilderBottomDockToolbar: React.FC<BuilderBottomDockToolbarProps> = ({
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
}) => {
  return (
    <footer
      aria-label="Builder Actions Dock"
      className="shrink-0 w-full backdrop-blur-md bg-surface-card/95 border border-white/10 rounded-apple-xl px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-between gap-2 shadow-apple-elevated overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={14} className="text-cyan-400" />}
          onClick={onAddContainer}
          title="Add another Discord Type 17 Container"
        >
          Container
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Layers size={14} className="text-blue-400" />}
          onClick={onAddActionRow}
          title="Add Action Row (Type 1)"
        >
          Action Row
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Sparkles size={14} className="text-purple-400" />}
          onClick={onOpenPaletteModal}
          title="Insert Discord Component Types (1 to 23)"
        >
          + UI Components
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<FolderOpen size={14} className="text-emerald-400" />}
          onClick={onOpenLoadModal}
          title="Load Template or Built-in Preset"
        >
          Load
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} className="text-red-400" />}
          onClick={onClearCanvas}
          title="Reset Canvas"
        >
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last edit action (Ctrl + Z)"
          aria-label="Undo action"
          leftIcon={<Undo2 size={13} />}
        >
          Undo
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo edit action (Ctrl + Y)"
          aria-label="Redo action"
          leftIcon={<Redo2 size={13} />}
        >
          Redo
        </Button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenEmojiPicker}
          title="Open Discord Emoji Picker"
          aria-label="Open Discord Emoji Picker"
          className="p-1.5 rounded-apple-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <Smile size={16} />
        </button>
      </div>
    </footer>
  );
};
