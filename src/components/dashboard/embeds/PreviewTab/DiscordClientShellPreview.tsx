'use client';

import React from 'react';

export interface DiscordClientShellPreviewProps {
  channelName?: string;
  children: React.ReactNode;
}

export const DiscordClientShellPreview: React.FC<
  DiscordClientShellPreviewProps
> = ({ channelName = 'command-announcements', children }) => {
  return (
    <div className="w-full rounded-apple-xl overflow-hidden border border-white/[0.08] bg-[#313338] shadow-apple-card flex flex-col">
      <div className="h-10 px-4 bg-[#313338] border-b border-[#1F2023] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#949BA4]">
            Discord Client Simulation
          </span>
        </div>
      </div>

      <div className="p-4 min-h-[380px] flex flex-col justify-start">
        {children}
      </div>
    </div>
  );
};
