'use client';

import React, { useState } from 'react';
import { ExternalLink, Smile } from 'lucide-react';
import {
  DISCORD_SAFE_URL_REGEX,
  type ButtonStyle,
  type DiscordButtonComponent,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import { DiscordEmoji } from '@/components/dashboard/embeds/emoji/DiscordEmojiRenderer';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';

export interface ButtonConfigModalProps {
  isOpen: boolean;
  button: DiscordButtonComponent | null;
  availableActions?: EmbedAction[];
  onOpenEmojiPicker?: (onSelect: (token: string) => void) => void;
  onClose: () => void;
  onSave: (updated: DiscordButtonComponent) => void;
}

const getInitialEmojiText = (
  emoji?: string | { name?: string; id?: string; animated?: boolean }
): string => {
  if (!emoji) return '';
  if (typeof emoji === 'string') return emoji;
  if (emoji.id) {
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
  }
  return emoji.name || '';
};

export const ButtonConfigModal: React.FC<ButtonConfigModalProps> = ({
  isOpen,
  button,
  availableActions = [],
  onOpenEmojiPicker,
  onClose,
  onSave,
}) => {
  const [prevButton, setPrevButton] = useState(button);
  const [label, setLabel] = useState(button?.label ?? 'Execute Action');
  const [style, setStyle] = useState<ButtonStyle>(button?.style ?? 1);
  const [customId, setCustomId] = useState(button?.custom_id ?? '');
  const [url, setUrl] = useState(button?.url ?? 'https://');
  const [emojiText, setEmojiText] = useState(getInitialEmojiText(button?.emoji));
  const [disabled, setDisabled] = useState(Boolean(button?.disabled));

  if (button !== prevButton) {
    setPrevButton(button);
    setLabel(button?.label ?? 'Execute Action');
    setStyle(button?.style ?? 1);
    setCustomId(button?.custom_id ?? '');
    setUrl(button?.url ?? 'https://');
    setEmojiText(getInitialEmojiText(button?.emoji));
    setDisabled(Boolean(button?.disabled));
  }

  const isLinkStyle = style === 5;
  const isUrlValid =
    !isLinkStyle || (url.trim().length > 0 && DISCORD_SAFE_URL_REGEX.test(url.trim()));
  const urlError =
    isLinkStyle && !isUrlValid
      ? 'Only safe https://, http://, or discord:// URLs are permitted.'
      : undefined;

  const canSave =
    label.trim().length > 0 &&
    (isLinkStyle ? isUrlValid : customId.trim().length > 0);

  const actionOptions: DropdownOption<string>[] = availableActions.map(
    (act) => ({
      label: `${act.name} (${act.actionType})`,
      value: act.actionId,
      description: act.actionId,
    })
  );

  const handleSave = () => {
    if (!button || !canSave) return;
    const cleanEmoji = emojiText.trim();
    let emojiPayload: DiscordButtonComponent['emoji'] = undefined;
    if (cleanEmoji) {
      const match = cleanEmoji.match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/);
      if (match) {
        emojiPayload = {
          animated: Boolean(match[1]),
          name: match[2],
          id: match[3],
        };
      } else {
        emojiPayload = { name: cleanEmoji };
      }
    }

    const updated: DiscordButtonComponent = {
      ...button,
      label: label.trim(),
      style,
      disabled,
      emoji: emojiPayload,
      ...(isLinkStyle
        ? { url: url.trim(), custom_id: undefined }
        : { custom_id: customId.trim(), url: undefined }),
    };
    onSave(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Button Settings"
      description="Configure settings of Button in the embedded message."
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
            disabled={!canSave}
            onClick={handleSave}
          >
            Save Button
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 1. Button Style Chips */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Button Style (Discord Specification)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setStyle(1)}
              className={`h-9 flex items-center justify-center px-3 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
                style === 1
                  ? 'bg-[#5865F2] text-white border-[#7983f5] shadow-[0_0_14px_rgba(88,101,242,0.4)]'
                  : 'bg-[#5865F2]/15 text-[#a5b4fc] border-[#5865F2]/30 hover:bg-[#5865F2]/25'
              }`}
            >
              Primary
            </button>
            <button
              type="button"
              onClick={() => setStyle(2)}
              className={`h-9 flex items-center justify-center px-3 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
                style === 2
                  ? 'bg-[#4e5058] text-white border-zinc-400 shadow-[0_0_14px_rgba(78,80,88,0.5)]'
                  : 'bg-white/[0.06] text-zinc-300 border-white/10 hover:bg-white/[0.1]'
              }`}
            >
              Secondary
            </button>
            <button
              type="button"
              onClick={() => setStyle(3)}
              className={`h-9 flex items-center justify-center px-3 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
                style === 3
                  ? 'bg-[#23a55a] text-white border-[#2dc76d] shadow-[0_0_14px_rgba(35,165,90,0.4)]'
                  : 'bg-[#23a55a]/15 text-[#4ade80] border-[#23a55a]/30 hover:bg-[#23a55a]/25'
              }`}
            >
              Success
            </button>
            <button
              type="button"
              onClick={() => setStyle(4)}
              className={`h-9 flex items-center justify-center px-3 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
                style === 4
                  ? 'bg-[#da373c] text-white border-[#f23f43] shadow-[0_0_14px_rgba(218,55,60,0.4)]'
                  : 'bg-[#da373c]/15 text-[#f87171] border-[#da373c]/30 hover:bg-[#da373c]/25'
              }`}
            >
              Danger
            </button>
            <button
              type="button"
              onClick={() => setStyle(5)}
              className={`col-span-2 sm:col-span-1 h-9 flex items-center justify-center px-3 rounded-apple-md text-xs font-bold transition-all cursor-pointer border gap-1.5 ${
                style === 5
                  ? 'bg-[#4e5058] text-white border-zinc-400 shadow-[0_0_14px_rgba(78,80,88,0.5)]'
                  : 'bg-white/[0.06] text-zinc-300 border-white/10 hover:bg-white/[0.1]'
              }`}
            >
              <span>Link</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* 2. Button Label & Emoji */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <TextInput
              label="Button Label (Max 80 chars)"
              value={label}
              maxLength={80}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Execute Action"
            />
          </div>
          <div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Emoji</label>
              <div className="flex items-center gap-2">
                <TextInput
                  value={emojiText}
                  onChange={(e) => setEmojiText(e.target.value)}
                  placeholder=""
                  className="flex-1"
                  leftIcon={
                    emojiText ? (
                      <span className="flex items-center justify-center w-4 h-4">
                        <DiscordEmoji emoji={emojiText} />
                      </span>
                    ) : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenEmojiPicker) {
                      onOpenEmojiPicker((token) => setEmojiText(token));
                    }
                  }}
                  className="h-[38px] px-3 rounded-apple-md border flex items-center justify-center transition-all cursor-pointer bg-[#0E0E12] border-surface-border hover:border-white/20 text-zinc-300 hover:text-brand-red shrink-0"
                  title="Pick Discord Emoji"
                  aria-label="Pick Discord Emoji"
                >
                  <Smile size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Link URL vs Custom ID / Action Template */}
        {isLinkStyle ? (
          <TextInput
            label="Target URL (https:// or discord://)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={urlError}
            placeholder="https://discord.com/..."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {actionOptions.length > 0 && (
              <Dropdown
                label="Action Template"
                options={[
                  { label: 'None (Manual Custom ID)', value: '' },
                  ...actionOptions,
                ]}
                value={actionOptions.some((opt) => opt.value === customId) ? customId : ''}
                onChange={(val) => setCustomId(val)}
                placeholder="Select an rng_act_* template..."
                searchable
              />
            )}
            <div className="flex flex-col gap-1">
              <TextInput
                label="Custom ID / Action Identifier"
                value={customId}
                maxLength={100}
                disabled={Boolean(actionOptions.some((opt) => opt.value === customId && customId !== ''))}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="custom_button_id or rng_act_..."
                helperText={
                  actionOptions.some((opt) => opt.value === customId && customId !== '')
                    ? 'Bound to selected Action Template'
                    : 'Custom Discord component custom_id string (max 100 chars).'
                }
              />
            </div>
          </div>
        )}

        {/* 4. Disabled State */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-zinc-300">Disable Button Interaction</span>
          <ToggleSwitch
            checked={disabled}
            onChange={setDisabled}
          />
        </div>
      </div>
    </Modal>
  );
};
