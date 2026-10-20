import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Server Settings — RNG Control Center',
  description: 'Configure Discord guild profile, Nitro boost perks, channels, and notifications.',
};

export default function ServerSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
