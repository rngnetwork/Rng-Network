'use client';

import React, { useState } from 'react';
import { Minus, BoxSelect, Minimize2, Maximize2 } from 'lucide-react';
import type { DiscordSeparatorComponent } from '@/lib/model/embed';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';

export interface SeparatorConfigModalProps {
  isOpen: boolean;
  separator: DiscordSeparatorComponent | null;
  onClose: () => void;
  onSave: (updated: DiscordSeparatorComponent) => void;
}

export const SeparatorConfigModal: React.FC<SeparatorConfigModalProps> = ({
  isOpen,
  separator,
  onClose,
  onSave,
}) => {
  const [prevSeparator, setPrevSeparator] = useState(separator);
  const [customId, setCustomId] = useState(separator?.id || '');
  const [isDivider, setIsDivider] = useState(separator?.divider !== false);
  const [spacing, setSpacing] = useState<1 | 2>(
    separator?.spacing === 2 ? 2 : 1
  );

  if (separator !== prevSeparator) {
    setPrevSeparator(separator);
    setCustomId(separator?.id || '');
    setIsDivider(separator?.divider !== false);
    setSpacing(separator?.spacing === 2 ? 2 : 1);
  }

  const handleSave = () => {
    if (!separator) return;
    const trimmedId = customId.trim() || separator.id || `sep_${Date.now()}`;
    const updated: DiscordSeparatorComponent = {
      ...separator,
      type: 14,
      id: trimmedId,
      divider: isDivider,
      spacing,
    };
    onSave(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Separator Settings (Type 14 • Separator)"
      description="Configure horizontal divider line rule or spacing gap between Discord message components."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Custom ID */}
        <TextInput
          label="Custom ID (Unique Identifier)"
          value={customId}
          placeholder="e.g. sep_section_divider"
          onChange={(e) => setCustomId(e.target.value)}
        />

        {/* Separator Mode: Line Divider vs Empty Space */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Separator Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsDivider(true)}
              className={`p-3.5 rounded-apple-lg border text-left transition-all cursor-pointer ${
                isDivider
                  ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-apple-card'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-semibold text-xs text-white">
                <Minus size={14} className={isDivider ? 'text-purple-400' : 'text-zinc-500'} />
                <span>Line Divider</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Renders a visible 1px horizontal rule
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsDivider(false)}
              className={`p-3.5 rounded-apple-lg border text-left transition-all cursor-pointer ${
                !isDivider
                  ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-apple-card'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-semibold text-xs text-white">
                <BoxSelect size={14} className={!isDivider ? 'text-purple-400' : 'text-zinc-500'} />
                <span>Empty Space</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Invisible spacing gap between components
              </p>
            </button>
          </div>
        </div>

        {/* Spacing Interval: Small (1, 4px) vs Large (2, 20px) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Spacing Interval
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSpacing(1)}
              className={`p-3.5 rounded-apple-lg border text-left transition-all cursor-pointer ${
                spacing === 1
                  ? 'bg-brand-red/15 border-brand-red/40 text-white shadow-apple-card'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-semibold text-xs text-white">
                <Minimize2 size={14} className={spacing === 1 ? 'text-brand-red' : 'text-zinc-500'} />
                <span>Small Spacing</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Spacing 1 (4px padding)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSpacing(2)}
              className={`p-3.5 rounded-apple-lg border text-left transition-all cursor-pointer ${
                spacing === 2
                  ? 'bg-brand-red/15 border-brand-red/40 text-white shadow-apple-card'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-semibold text-xs text-white">
                <Maximize2 size={14} className={spacing === 2 ? 'text-brand-red' : 'text-zinc-500'} />
                <span>Large Spacing</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Spacing 2 (20px padding)
              </p>
            </button>
          </div>
        </div>

        {/* Live Simulation Preview */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Live Simulation Preview
          </label>
          <div className="p-4 rounded-apple-lg bg-[#1E1F22] border border-white/10 flex flex-col gap-1">
            <div className="text-[11px] text-zinc-500 select-none">
              Content block above separator
            </div>
            {isDivider ? (
              <div className={`w-full ${spacing === 2 ? 'py-4' : 'py-1.5'}`}>
                <div className="h-px bg-white/20 w-full" />
              </div>
            ) : (
              <div
                className={`w-full rounded border border-dashed border-white/20 bg-white/[0.02] flex items-center justify-center ${
                  spacing === 2 ? 'h-7' : 'h-4'
                }`}
              >
                <span className="text-[10px] font-medium text-zinc-500 select-none">
                  Empty Space ({spacing === 2 ? 'Large — 20px' : 'Small — 4px'})
                </span>
              </div>
            )}
            <div className="text-[11px] text-zinc-500 select-none">
              Content block below separator
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
