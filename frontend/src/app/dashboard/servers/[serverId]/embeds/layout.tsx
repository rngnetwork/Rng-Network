import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Server Embed Builder — RNG Control Center',
  description: 'Guild-scoped Discord Components V2 builder and interactive Action Registry.',
};

export default function ServerEmbedsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full h-full flex-1 min-h-0 flex flex-col">{children}</div>;
}
