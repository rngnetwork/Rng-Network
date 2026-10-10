import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discord 2FA Challenge — RNG Control Center',
  description: 'Complete cryptographic Discord Snowflake verification.',
};

export default function TwoFactorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
      {children}
    </div>
  );
}
