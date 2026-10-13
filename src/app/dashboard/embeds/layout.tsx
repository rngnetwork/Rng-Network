import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Embed Builder V2 — RNG Control Center',
  description: 'Visual Discord Components V2 message builder, preview simulator, and dispatch engine.',
};

export default function EmbedsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full h-full flex-1 min-h-0 flex flex-col">{children}</div>;
}
