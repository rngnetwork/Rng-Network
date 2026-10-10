'use client';

import React from 'react';
import type { ServerItem } from '@/lib/model/server';
import { ServerCardItem } from './ServerCardItem';

export interface ServerDirectoryCardProps {
  server: ServerItem;
  index?: number;
  onManage: (server: ServerItem) => void;
}

export const ServerDirectoryCard: React.FC<ServerDirectoryCardProps> = (props) => {
  return <ServerCardItem {...props} />;
};
