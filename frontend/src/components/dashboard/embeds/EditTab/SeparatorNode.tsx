'use client';

import React from 'react';
import type { DiscordSeparatorComponent } from '@/lib/model/embed';

export interface SeparatorNodeProps {
  separator: DiscordSeparatorComponent;
  onUpdateSeparator: (
    componentId: string,
    updates: Partial<DiscordSeparatorComponent>
  ) => void;
  onRemove?: (componentId: string) => void;
}

const SeparatorNodeInner: React.FC<SeparatorNodeProps> = ({
  separator,
}) => {
  const showDivider = separator.divider !== false;
  const isLarge = separator.spacing === 2;

  return (
    <div className="w-full p-3 rounded-apple-lg bg-zinc-900/70 border border-white/[0.08] flex items-center justify-center">
      {showDivider ? (
        <div className={`w-full flex items-center justify-center ${isLarge ? 'py-4' : 'py-2'}`}>
          <div className="w-full h-[1px] bg-white/20 rounded-full" />
        </div>
      ) : (
        <div
          className={`w-full rounded border border-dashed border-white/15 flex items-center justify-center text-[10px] text-zinc-400 font-mono select-none ${
            isLarge ? 'h-10' : 'h-6'
          } bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.04)_6px,rgba(255,255,255,0.04)_12px)]`}
        >
          {isLarge ? 'Empty Space (Large — 20px)' : 'Empty Space (Small — 4px)'}
        </div>
      )}
    </div>
  );
};

export const SeparatorNode = React.memo(SeparatorNodeInner);
