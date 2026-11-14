'use client';

import React from 'react';
import { DiscordMarkdown } from '@/components/common/display/DiscordMarkdown';

export interface DiscordTextDisplayPreviewProps {
  content: string;
  className?: string;
}

export const DiscordTextDisplayPreview: React.FC<DiscordTextDisplayPreviewProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;
  return <DiscordMarkdown content={content} className={className} />;
};
