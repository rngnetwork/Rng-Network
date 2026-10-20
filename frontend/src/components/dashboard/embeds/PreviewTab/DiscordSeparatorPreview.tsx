'use client';

import React from 'react';
import type { DiscordSeparatorComponent } from '@/lib/model/embed';

export interface DiscordSeparatorPreviewProps {
  separator: DiscordSeparatorComponent;
}

export const DiscordSeparatorPreview: React.FC<
  DiscordSeparatorPreviewProps
> = ({ separator }) => {
  const paddingClass = separator.spacing === 2 ? 'py-3' : 'py-1.5';
  const showLine = separator.divider !== false;

  return (
    <div className={`w-full ${paddingClass}`}>
      {showLine && <div className="w-full h-px bg-[#3F4147]" />}
    </div>
  );
};
