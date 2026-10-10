'use client';

import React from 'react';
import type { Type17Container } from '@/lib/model/embed';
import { DiscordClientShellPreview } from './DiscordClientShellPreview';
import { DiscordMessageCardPreview } from './DiscordMessageCardPreview';

export interface GlobalPreviewCoordinatorProps {
  messageContent: string;
  containers: Type17Container[];
  channelName?: string;
}

export const GlobalPreviewCoordinator: React.FC<
  GlobalPreviewCoordinatorProps
> = ({ messageContent, containers, channelName }) => {
  return (
    <DiscordClientShellPreview channelName={channelName}>
      <DiscordMessageCardPreview
        messageContent={messageContent}
        containers={containers}
      />
    </DiscordClientShellPreview>
  );
};
