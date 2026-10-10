'use client';

import React from 'react';
import { Minus, Trash2 } from 'lucide-react';
import type { DiscordSeparatorComponent } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';

export interface SeparatorNodeProps {
  separator: DiscordSeparatorComponent;
  onUpdateSeparator: (
    componentId: string,
    updates: Partial<DiscordSeparatorComponent>
  ) => void;
  onRemove: (componentId: string) => void;
}

const SeparatorNodeInner: React.FC<SeparatorNodeProps> = ({
  separator,
  onUpdateSeparator,
  onRemove,
}) => {
  const componentId = separator.id || '';
  const showDivider = separator.divider !== false;

  return (
    <div className="p-3 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Minus size={14} className="text-brand-red" />
        <Badge variant="neutral" size="sm">
          Separator (Type 14)
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <ToggleSwitch
          size="sm"
          checked={showDivider}
          onChange={(checked) =>
            onUpdateSeparator(componentId, { divider: checked })
          }
          label="Visible Line"
        />

        <div className="inline-flex rounded-apple-sm bg-black/50 p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => onUpdateSeparator(componentId, { spacing: 1 })}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              separator.spacing === 1
                ? 'bg-brand-red text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Small (1)
          </button>
          <button
            type="button"
            onClick={() => onUpdateSeparator(componentId, { spacing: 2 })}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              separator.spacing === 2
                ? 'bg-brand-red text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Large (2)
          </button>
        </div>

        {componentId && (
          <button
            type="button"
            onClick={() => onRemove(componentId)}
            aria-label="Remove Separator"
            className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export const SeparatorNode = React.memo(SeparatorNodeInner);
