'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import {
  ComponentType,
  DISCORD_SAFE_URL_REGEX,
  type DiscordActionRowComponent,
  type DiscordButtonComponent,
  type DiscordSelectComponent,
  type DiscordStringSelectComponent,
} from '@/lib/model/embed';

export interface DiscordActionRowPreviewProps {
  row: DiscordActionRowComponent;
}

const BUTTON_STYLE_MAP: Record<DiscordButtonComponent['style'], string> = {
  1: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
  2: 'bg-[#4E5058] hover:bg-[#6D6F78] text-white',
  3: 'bg-[#248046] hover:bg-[#1A6334] text-white',
  4: 'bg-[#DA373C] hover:bg-[#A12828] text-white',
  5: 'bg-[#4E5058] hover:bg-[#6D6F78] text-white',
};

export const DiscordActionRowPreview: React.FC<DiscordActionRowPreviewProps> = ({
  row,
}) => {
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [selectedOptionLabel, setSelectedOptionLabel] = useState<
    Record<string, string>
  >({});

  const buttons = row.components.filter(
    (c): c is DiscordButtonComponent => c.type === ComponentType.BUTTON
  );
  const selects = row.components.filter(
    (c): c is DiscordSelectComponent =>
      c.type === ComponentType.STRING_SELECT ||
      c.type === ComponentType.USER_SELECT ||
      c.type === ComponentType.ROLE_SELECT ||
      c.type === ComponentType.MENTIONABLE_SELECT ||
      c.type === ComponentType.CHANNEL_SELECT
  );

  return (
    <div className="flex flex-col gap-2 my-1">
      {buttons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {buttons.map((btn, idx) => {
            const emojiStr =
              typeof btn.emoji === 'string'
                ? btn.emoji
                : btn.emoji?.name ?? '';
            const isSafeLink =
              btn.style === 5 &&
              btn.url &&
              DISCORD_SAFE_URL_REGEX.test(btn.url);

            if (isSafeLink) {
              return (
                <a
                  key={btn.id || `p_btn_${idx}`}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 min-h-[32px] rounded-[3px] text-[14px] font-medium transition-colors ${
                    BUTTON_STYLE_MAP[5]
                  } ${btn.disabled ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {emojiStr && <span>{emojiStr}</span>}
                  <span>{btn.label || 'Link'}</span>
                  <ExternalLink size={14} className="opacity-80" />
                </a>
              );
            }

            return (
              <button
                key={btn.id || `p_btn_${idx}`}
                type="button"
                disabled={btn.disabled}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 min-h-[32px] rounded-[3px] text-[14px] font-medium transition-colors ${
                  BUTTON_STYLE_MAP[btn.style]
                } ${btn.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {emojiStr && <span>{emojiStr}</span>}
                <span>{btn.label || 'Button'}</span>
                {btn.style === 5 && (
                  <ExternalLink size={14} className="opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {selects.map((sel, idx) => {
        const selectKey = sel.id || `p_sel_${idx}`;
        const isOpen = openSelectId === selectKey;
        const chosen = selectedOptionLabel[selectKey];

        return (
          <div key={selectKey} className="relative w-full max-w-md">
            <button
              type="button"
              disabled={sel.disabled}
              onClick={() =>
                setOpenSelectId((prev) => (prev === selectKey ? null : selectKey))
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] bg-[#1E1F22] border border-[#111214] text-[14px] text-[#DBDEE1] hover:border-[#4E5058] transition-colors"
            >
              <span className={chosen ? 'text-white' : 'text-[#949BA4]'}>
                {chosen || sel.placeholder || 'Make a selection'}
              </span>
              <ChevronDown
                size={16}
                className={`text-[#B5BAC1] transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && 'options' in sel && Array.isArray((sel as DiscordStringSelectComponent).options) && (sel as DiscordStringSelectComponent).options.length > 0 && (
              <div className="mt-1 rounded-[4px] bg-[#2B2D31] border border-[#1E1F22] shadow-xl overflow-hidden z-20">
                {(sel as DiscordStringSelectComponent).options.map((opt, oIdx) => (
                  <button
                    key={`${opt.value}_${oIdx}`}
                    type="button"
                    onClick={() => {
                      setSelectedOptionLabel((prev) => ({
                        ...prev,
                        [selectKey]: opt.label,
                      }));
                      setOpenSelectId(null);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#35373C] transition-colors flex flex-col"
                  >
                    <span className="text-[14px] font-medium text-white">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span className="text-[12px] text-[#949BA4]">
                        {opt.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
