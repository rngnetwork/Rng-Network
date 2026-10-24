import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Network Bot Configuration — RNG Control Center',
  description: 'Manage network-wide bot modules and global administration settings across all servers.',
};

export default function BotConfigLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
