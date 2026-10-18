'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { Type17Container } from '@/lib/model/embed';
import { DiscordTextDisplayPreview } from './DiscordTextDisplayPreview';
import { DiscordContainerPreview } from './DiscordContainerPreview';

export interface DiscordMessageCardPreviewProps {
  messageContent: string;
  containers: Type17Container[];
  botName?: string;
}

export const DiscordMessageCardPreview: React.FC<
  DiscordMessageCardPreviewProps
> = ({ messageContent, containers, botName = 'RNG Gaming' }) => {
  const [timeStr, setTimeStr] = useState('12:00 PM');

  useEffect(() => {
    setTimeStr(
      new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    );
  }, []);

  return (
    <div className="flex items-start gap-4 px-4 py-3 hover:bg-[#2E3035] rounded-[4px] transition-colors">
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#1e1f22] relative">
        <Image
          src="/assets/RNG_MAIN_LOGO_TRANSPARENT.png"
          alt={botName}
          width={40}
          height={40}
          unoptimized
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-semibold text-white hover:underline cursor-pointer">
            {botName}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-[#5865F2] text-[10px] font-bold uppercase text-white tracking-wide">
            <Check size={10} className="stroke-[3]" />
            APP
          </span>
          <span className="text-[11px] text-[#949BA4] ml-1">
            Today at {timeStr}
          </span>
        </div>

        {messageContent.trim().length > 0 && (
          <DiscordTextDisplayPreview content={messageContent} />
        )}

        <div className="flex flex-col gap-2.5 mt-0.5">
          {containers.map((container) => (
            <DiscordContainerPreview
              key={container.id}
              container={container}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
