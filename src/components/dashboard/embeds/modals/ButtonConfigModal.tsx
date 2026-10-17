'use client';

import React, { useState } from 'react';
import { ExternalLink, Smile, CheckCircle2 } from 'lucide-react';
import {
  DISCORD_SAFE_URL_REGEX,
  type ButtonStyle,
  type DiscordButtonComponent,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';

export interface ButtonConfigModalProps {
  isOpen: boolean;
  button: DiscordButtonComponent | null;
  availableActions?: EmbedAction[];
  onClose: () => void;
  onSave: (updated: DiscordButtonComponent) => void;
}

const QUICK_BUTTON_EMOJIS = ['🛡️', '⚔️', '✅', '❌', '📜', '⭐', '🎫', '🔔'];

export const ButtonConfigModal: React.FC<ButtonConfigModalProps> = ({
  isOpen,
  button,
  availableActions = [],
  onClose,
  onSave,
}) => {
  const [prevButton, setPrevButton] = useState(button);
  const [label, setLabel] = useState(button?.label ?? 'Execute Action');
  const [style, setStyle] = useState<ButtonStyle>(button?.style ?? 1);
  const [customId, setCustomId] = useState(button?.custom_id ?? '');
  const [url, setUrl] = useState(button?.url ?? 'https://');
  const [emojiText, setEmojiText] = useState(
    typeof button?.emoji === 'string'
      ? button.emoji
      : button?.emoji?.name ?? ''
  );
  const [disabled, setDisabled] = useState(Boolean(button?.disabled));

  if (button !== prevButton) {
    setPrevButton(button);
    setLabel(button?.label ?? 'Execute Action');
    setStyle(button?.style ?? 1);
    setCustomId(button?.custom_id ?? '');
    setUrl(button?.url ?? 'https://');
    setEmojiText(
      typeof button?.emoji === 'string'
        ? button.emoji
        : button?.emoji?.name ?? ''
    );
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
    const updated: DiscordButtonComponent = {
      ...button,
      label: label.trim(),
      style,
      disabled,
      emoji: emojiText.trim() ? { name: emojiText.trim() } : undefined,
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
      title="Configure Interactive Button (Type 2)"
      description="Bind button to a registered Action ID (rng_act_*) or safe external link."
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
              className={`px-3 py-2 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
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
              className={`px-3 py-2 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
                style === 2
                  ? 'bg-[#4e5058] text-white border-[#6d6f78] shadow-[0_0_14px_rgba(78,80,88,0.4)]'
                  : 'bg-white/[0.06] text-zinc-300 border-white/10 hover:bg-white/[0.1]'
              }`}
            >
              Secondary
            </button>
            <button
              type="button"
              onClick={() => setStyle(3)}
              className={`px-3 py-2 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
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
              className={`px-3 py-2 rounded-apple-md text-xs font-bold transition-all cursor-pointer border ${
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
              className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-apple-md text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                style === 5
                  ? 'bg-[#4e5058] text-white border-[#6d6f78] shadow-[0_0_14px_rgba(78,80,88,0.4)]'
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Emoji</label>
                <div className="flex items-center gap-1">
                  {QUICK_BUTTON_EMOJIS.slice(0, 4).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEmojiText(emoji)}
                      className="text-xs hover:scale-125 transition-transform"
                      title={`Select ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <TextInput
                value={emojiText}
                onChange={(e) => setEmojiText(e.target.value)}
                placeholder="🛡️"
              />
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
                label="Bind to Registered Action Template"
                options={actionOptions}
                value={customId}
                onChange={(val) => setCustomId(val)}
                placeholder="Select an rng_act_* template..."
                searchable
              />
            )}
            <TextInput
              label="Custom ID / Action Identifier"
              value={customId}
              maxLength={100}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="rng_act_0123456789abcdef"
              helperText={
                customId.startsWith('rng_act_')
                  ? '✓ JDA Gateway Handled Action Template'
                  : 'Custom Discord component custom_id string.'
              }
            />
          </div>
        )}

        {/* 4. Disabled State */}
        <ToggleSwitch
          checked={disabled}
          onChange={setDisabled}
          label="Disable Button Interaction"
          description="Render button in non-clickable disabled state in Discord"
        />
      </div>
    </Modal>
  );
};
