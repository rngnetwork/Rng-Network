'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  DiscordStringSelectComponent,
  DiscordSelectOption,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { Button } from '@/components/common/input/Button';

export interface SelectMenuConfigModalProps {
  isOpen: boolean;
  selectMenu: DiscordStringSelectComponent | null;
  availableActions?: EmbedAction[];
  onClose: () => void;
  onSave: (updated: DiscordStringSelectComponent) => void;
}

export const SelectMenuConfigModal: React.FC<SelectMenuConfigModalProps> = ({
  isOpen,
  selectMenu,
  availableActions = [],
  onClose,
  onSave,
}) => {
  const [prevSelectMenu, setPrevSelectMenu] = useState(selectMenu);
  const [customId, setCustomId] = useState(
    selectMenu?.custom_id ?? 'rng_sel_default'
  );
  const [placeholder, setPlaceholder] = useState(
    selectMenu?.placeholder ?? 'Select an option...'
  );
  const [options, setOptions] = useState<DiscordSelectOption[]>(
    selectMenu?.options ?? [
      { label: 'Option 1', value: 'opt_1', description: '' },
    ]
  );

  if (selectMenu !== prevSelectMenu) {
    setPrevSelectMenu(selectMenu);
    setCustomId(selectMenu?.custom_id || 'rng_sel_default');
    setPlaceholder(selectMenu?.placeholder ?? 'Select an option...');
    setOptions(
      selectMenu && selectMenu.options.length > 0
        ? selectMenu.options
        : [{ label: 'Option 1', value: 'opt_1', description: '' }]
    );
  }

  const actionOptions: DropdownOption<string>[] = availableActions.map(
    (act) => ({
      label: `${act.name} (${act.actionId})`,
      value: act.actionId,
    })
  );

  const handleUpdateOption = (
    idx: number,
    updates: Partial<DiscordSelectOption>
  ) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, ...updates } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 25) return;
    setOptions((prev) => [
      ...prev,
      {
        label: `Option ${prev.length + 1}`,
        value: `opt_${prev.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!selectMenu || !customId.trim() || options.length === 0) return;
    onSave({
      ...selectMenu,
      custom_id: customId.trim(),
      placeholder: placeholder.trim(),
      options,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure String Select Menu (Type 3)"
      description="Configure dropdown placeholder and bind option values to Action Registry IDs."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!customId.trim() || options.length === 0}
            onClick={handleSave}
          >
            Save Select Menu
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Menu Custom ID"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="rng_sel_ministry"
          />
          <TextInput
            label="Placeholder Text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Choose a division..."
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-xs font-mono font-semibold uppercase text-zinc-300">
            Select Options ({options.length}/25)
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={options.length >= 25}
            leftIcon={<Plus size={13} />}
            onClick={handleAddOption}
          >
            Add Option
          </Button>
        </div>

        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
          {options.map((opt, idx) => (
            <div
              key={`opt_${idx}`}
              className="p-3 rounded-apple-md bg-black/40 border border-white/[0.08] flex flex-col gap-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <TextInput
                  label={`Option #${idx + 1} Label`}
                  value={opt.label}
                  onChange={(e) =>
                    handleUpdateOption(idx, { label: e.target.value })
                  }
                />
                <TextInput
                  label="Value / Action ID (rng_act_*)"
                  value={opt.value}
                  onChange={(e) =>
                    handleUpdateOption(idx, { value: e.target.value })
                  }
                />
              </div>

              {actionOptions.length > 0 && (
                <Dropdown
                  label="Or Bind Option to Action Template"
                  options={actionOptions}
                  value={opt.value}
                  onChange={(val) => handleUpdateOption(idx, { value: val })}
                  placeholder="Select action template..."
                />
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TextInput
                    label="Description (Optional)"
                    value={opt.description ?? ''}
                    onChange={(e) =>
                      handleUpdateOption(idx, { description: e.target.value })
                    }
                  />
                </div>
                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    aria-label={`Remove option ${idx + 1}`}
                    className="p-2 mb-0.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
