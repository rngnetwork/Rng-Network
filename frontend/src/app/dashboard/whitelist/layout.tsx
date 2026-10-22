import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personnel Whitelist — RNG Control Center',
  description: 'Manage whitelisted personnel, ministry clearances, and rank hierarchy.',
};

export default function WhitelistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
