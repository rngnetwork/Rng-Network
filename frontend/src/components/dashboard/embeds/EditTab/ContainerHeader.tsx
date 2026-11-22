'use client';

import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  EyeOff,
  User,
} from 'lucide-react';
import { Badge } from '@/components/common/feedback/Badge';
import { ColorPicker } from '@/components/common/input/ColorPicker';

export interface ContainerHeaderProps {
  cIdx: number;
  totalContainers: number;
  accentColor?: string;
  isSpoiler?: boolean;
  isAuthorCollapsed?: boolean;
  onUpdateAccent: (cIdx: number, color: string) => void;
  onToggleSpoiler: (cIdx: number) => void;
  onToggleAuthorCollapse: (cIdx: number) => void;
  onMoveContainer: (cIdx: number, direction: 'up' | 'down') => void;
  onRemoveContainer: (cIdx: number) => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export const ContainerHeader: React.FC<ContainerHeaderProps> = ({
  cIdx,
  totalContainers,
  accentColor = '#E11D2E',
  isSpoiler = false,
  isAuthorCollapsed = false,
  onUpdateAccent,
  onToggleSpoiler,
  onToggleAuthorCollapse,
  onMoveContainer,
  onRemoveContainer,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            Container #{cIdx + 1}
          </span>
          <Badge variant="crimson" size="sm">
            Type 17
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ColorPicker
          label=""
          color={accentColor}
          onChange={(hex) => onUpdateAccent(cIdx, hex)}
          presets={['#E11D2E', '#00A8FC', '#23A55A', '#FEE75C', '#EB459E', '#5865F2', '#2B2D31']}
        />

        <button
          type="button"
          onClick={() => onToggleSpoiler(cIdx)}
          title={isSpoiler ? 'Spoiler Enabled' : 'Toggle Spoiler Blur'}
          className={`p-1.5 rounded-apple-md transition-colors cursor-pointer border ${
            isSpoiler
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border-white/10'
          }`}
        >
          <EyeOff size={14} />
        </button>

        <button
          type="button"
          onClick={() => onToggleAuthorCollapse(cIdx)}
          title={isAuthorCollapsed ? 'Show Author / Footer' : 'Hide Author / Footer'}
          className={`p-1.5 rounded-apple-md transition-colors cursor-pointer border ${
            !isAuthorCollapsed
              ? 'bg-brand-red/15 text-brand-red border-brand-red/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border-white/10'
          }`}
        >
          <User size={14} />
        </button>

        <div className="flex items-center border border-white/10 rounded-apple-md overflow-hidden">
          <button
            type="button"
            disabled={cIdx === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMoveContainer(cIdx, 'up');
            }}
            title="Move container up"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={cIdx === totalContainers - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMoveContainer(cIdx, 'down');
            }}
            title="Move container down"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-white/10"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveContainer(cIdx);
          }}
          title="Remove container"
          className="p-1.5 rounded-apple-md text-red-400 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/50 hover:text-red-300 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
