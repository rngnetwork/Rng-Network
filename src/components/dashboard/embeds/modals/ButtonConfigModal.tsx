'use client';

import React, { useState } from 'react';
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

const STYLE_OPTIONS: DropdownOption<string>[] = [
  { label: 'Primary (Blurple - Style 1)', value: '1' },
  { label: 'Secondary (Grey - Style 2)', value: '2' },
  { label: 'Success (Green - Style 3)', value: '3' },
  { label: 'Danger (Red - Style 4)', value: '4' },
  { label: 'External Link (URL - Style 5)', value: '5' },
];

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
        <Dropdown
          label="Button Style"
          options={STYLE_OPTIONS}
          value={String(style)}
          onChange={(val) => setStyle(Number(val) as ButtonStyle)}
        />

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
            <TextInput
              label="Emoji"
              value={emojiText}
              onChange={(e) => setEmojiText(e.target.value)}
              placeholder="🛡️"
            />
          </div>
        </div>

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
            />
          </div>
        )}

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
