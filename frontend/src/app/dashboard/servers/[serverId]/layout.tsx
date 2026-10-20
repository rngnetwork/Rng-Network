import React from 'react';
import type { Metadata } from 'next';
import { ServerDetailShellClient } from '@/components/dashboard/servers/[serverId]/ServerDetailShellClient';

export const metadata: Metadata = {
  title: 'Guild Workspace — RNG Control Center',
  description: 'Manage server settings, bot runtime, Components V2 embeds, and analytics.',
};

export default function ServerDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ServerDetailShellClient>{children}</ServerDetailShellClient>;
}
