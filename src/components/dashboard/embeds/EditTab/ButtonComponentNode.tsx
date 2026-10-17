'use client';

import React from 'react';
import { Settings2, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DiscordButtonComponent } from '@/lib/model/embed';

export interface ButtonComponentNodeProps {
  button: DiscordButtonComponent;
  bIdx?: number;
  totalButtons?: number;
  onEdit: (button: DiscordButtonComponent) => void;
  onRemove: (buttonId: string) => void;
  onShiftLeft?: (bIdx: number) => void;
  onShiftRight?: (bIdx: number) => void;
  onLabelChange?: (bIdx: number, newLabel: string) => void;
}

const STYLE_CLASSES: Record<DiscordButtonComponent['style'], string> = {
  1: 'bg-[#5865F2] hover:bg-[#4752C4] text-white border-transparent',
  2: 'bg-[#4E5058] hover:bg-[#6D6F78] text-white border-transparent',
  3: 'bg-[#248046] hover:bg-[#1A6334] text-white border-transparent',
  4: 'bg-[#DA373C] hover:bg-[#A12828] text-white border-transparent',
  5: 'bg-[#4E5058] hover:bg-[#6D6F78] text-white border-transparent',
};

const ButtonComponentNodeInner: React.FC<ButtonComponentNodeProps> = ({
  button,
  bIdx,
  totalButtons = 1,
  onEdit,
  onRemove,
  onShiftLeft,
  onShiftRight,
  onLabelChange,
}) => {
  const emojiDisplay =
    typeof button.emoji === 'string'
      ? button.emoji
      : button.emoji?.name ?? '';

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-apple-md bg-black/40 border border-white/[0.08]">
      {/* Shift Left */}
      {bIdx !== undefined && onShiftLeft && (
        <button
          type="button"
          disabled={bIdx === 0}
          onClick={() => onShiftLeft(bIdx)}
          title="Shift Left"
          className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} />
        </button>
      )}

      {/* Shift Right */}
      {bIdx !== undefined && onShiftRight && (
        <button
          type="button"
          disabled={bIdx === totalButtons - 1}
          onClick={() => onShiftRight(bIdx)}
          title="Shift Right"
          className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight size={13} />
        </button>
      )}

      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[32px] rounded-[4px] text-xs font-medium transition-colors ${
          STYLE_CLASSES[button.style]
        } ${button.disabled ? 'opacity-50' : ''}`}
      >
        {emojiDisplay && <span className="text-xs">{emojiDisplay}</span>}
        {bIdx !== undefined && onLabelChange ? (
          <input
            type="text"
            value={button.label || ''}
            placeholder="Button"
            onChange={(e) => onLabelChange(bIdx, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-black/30 border border-white/20 rounded px-1.5 py-0.5 text-xs font-semibold text-white outline-none w-20 max-w-[130px] focus:border-white/50"
            title="Edit button label inline"
          />
        ) : (
          <span>{button.label || 'Button'}</span>
        )}
        {button.style === 5 && <ExternalLink size={12} className="opacity-80 shrink-0" />}
      </div>

      <button
        type="button"
        onClick={() => onEdit(button)}
        aria-label={`Configure button ${button.label || ''}`}
        title="Button Settings (Style, ID, Link, Emoji)"
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Settings2 size={13} />
      </button>

      {button.id && (
        <button
          type="button"
          onClick={() => onRemove(button.id!)}
          aria-label={`Remove button ${button.label || ''}`}
          title="Remove Button"
          className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};

export const ButtonComponentNode = React.memo(
  ButtonComponentNodeInner,
  (prev, next) =>
    prev.button.id === next.button.id &&
    prev.button.label === next.button.label &&
    prev.button.style === next.button.style &&
    prev.button.url === next.button.url &&
    prev.button.custom_id === next.button.custom_id &&
    prev.button.disabled === next.button.disabled &&
    prev.button.emoji === next.button.emoji
);
