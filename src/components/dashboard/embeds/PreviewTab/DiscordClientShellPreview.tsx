'use client';

import React from 'react';
import { Hash } from 'lucide-react';

export interface DiscordClientShellPreviewProps {
  channelName?: string;
  children: React.ReactNode;
}

export const DiscordClientShellPreview: React.FC<
  DiscordClientShellPreviewProps
> = ({ channelName = 'command-announcements', children }) => {
  return (
    <div className="w-full rounded-apple-xl overflow-hidden border border-white/[0.08] bg-[#313338] shadow-apple-card flex flex-col">
      <div className="h-12 px-4 bg-[#313338] border-b border-[#1F2023] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-[#80848E]" />
          <span className="text-sm font-semibold text-white">
            {channelName}
          </span>
          <span className="text-xs text-[#949BA4] hidden sm:inline ml-2 pl-2 border-l border-[#3F4147]">
            Discord Dark-Mode Client Simulation · Components V2 (Flags: 32768)
          </span>
        </div>
      </div>

      <div className="p-4 min-h-[380px] flex flex-col justify-start">
        {children}
      </div>
    </div>
  );
};
