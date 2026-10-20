import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bot Modules & Gateway — RNG Control Center',
  description: 'Configure JDA 5 WebSocket gateway settings, command prefixes, and permissions.',
};

export default function ServerBotConfigLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
