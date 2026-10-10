import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Server Management — RNG Control Center',
  description: 'Discover and manage Discord guilds connected to RNG Network.',
};

export default function ServersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
