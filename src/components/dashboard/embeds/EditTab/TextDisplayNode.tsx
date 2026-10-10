'use client';

import React from 'react';
import { Type, Trash2 } from 'lucide-react';
import type { DiscordTextDisplayComponent } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';

export interface TextDisplayNodeProps {
  node: DiscordTextDisplayComponent;
  onChangeContent: (componentId: string, content: string) => void;
  onRemove: (componentId: string) => void;
}

const TextDisplayNodeInner: React.FC<TextDisplayNodeProps> = ({
  node,
  onChangeContent,
  onRemove,
}) => {
  const componentId = node.id || '';

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type size={14} className="text-brand-red" />
          <Badge variant="neutral" size="sm">
            Text Display (Type 10)
          </Badge>
          <span className="text-[11px] font-mono text-zinc-500">
            {node.content.length} chars
          </span>
        </div>

        {componentId && (
          <button
            type="button"
            onClick={() => onRemove(componentId)}
            aria-label="Remove Text Display"
            className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <textarea
        value={node.content}
        rows={3}
        onChange={(e) => onChangeContent(componentId, e.target.value)}
        placeholder="Write Discord markdown content (supports # headers, **bold**, `code`, > quotes)..."
        className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/50 border border-white/10 focus:border-brand-red text-xs sm:text-sm text-white font-sans outline-none transition-colors resize-y"
      />
    </div>
  );
};

export const TextDisplayNode = React.memo(
  TextDisplayNodeInner,
  (prev, next) =>
    prev.node.id === next.node.id && prev.node.content === next.node.content
);
