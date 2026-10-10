'use client';

import React from 'react';
import { Settings2, Trash2, ExternalLink } from 'lucide-react';
import type { DiscordButtonComponent } from '@/lib/model/embed';

export interface ButtonComponentNodeProps {
  button: DiscordButtonComponent;
  onEdit: (button: DiscordButtonComponent) => void;
  onRemove: (buttonId: string) => void;
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
  onEdit,
  onRemove,
}) => {
  const emojiDisplay =
    typeof button.emoji === 'string'
      ? button.emoji
      : button.emoji?.name ?? '';

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-apple-md bg-black/40 border border-white/[0.08]">
      <button
        type="button"
        onClick={() => onEdit(button)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-[4px] text-xs font-medium transition-colors ${
          STYLE_CLASSES[button.style]
        } ${button.disabled ? 'opacity-50' : ''}`}
      >
        {emojiDisplay && <span>{emojiDisplay}</span>}
        <span>{button.label || 'Button'}</span>
        {button.style === 5 && <ExternalLink size={12} className="opacity-80" />}
      </button>

      <button
        type="button"
        onClick={() => onEdit(button)}
        aria-label={`Configure button ${button.label || ''}`}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Settings2 size={13} />
      </button>

      {button.id && (
        <button
          type="button"
          onClick={() => onRemove(button.id!)}
          aria-label={`Remove button ${button.label || ''}`}
          className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
