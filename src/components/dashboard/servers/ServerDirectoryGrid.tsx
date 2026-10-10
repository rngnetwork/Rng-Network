'use client';

import React from 'react';
import type { ServerItem } from '@/lib/model/server';
import { ManagedServersGrid } from './ManagedServersGrid';

export interface ServerDirectoryGridProps {
  servers: ServerItem[];
  onManageServer: (server: ServerItem) => void;
}

export const ServerDirectoryGrid: React.FC<ServerDirectoryGridProps> = (props) => {
  return <ManagedServersGrid {...props} />;
};
