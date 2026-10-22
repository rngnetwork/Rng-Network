import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication — RNG Control Center',
  description: 'Personnel clearance and two-phase Discord Snowflake authentication.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-surface-canvas text-zinc-50">{children}</div>;
}
