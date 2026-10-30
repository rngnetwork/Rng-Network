'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { DiscordTextDisplayComponent } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { DiscordMarkdownEditor } from '@/components/common/input/DiscordMarkdownEditor';

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
  const currentContent = node.content || '';

  return (
    <div className="p-3.5 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            Text Display (Type 10)
          </Badge>
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

      <DiscordMarkdownEditor
        value={currentContent}
        onChange={(val) => onChangeContent(componentId, val)}
        rows={3}
        placeholder="### Heading\n- List item\n**Bold text**\n> Blockquote text"
      />
    </div>
  );
};

export const TextDisplayNode = React.memo(
  TextDisplayNodeInner,
  (prev, next) =>
    prev.node.id === next.node.id && prev.node.content === next.node.content
);
