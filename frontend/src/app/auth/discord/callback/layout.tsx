import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discord OAuth Callback — RNG Control Center',
  description: 'Verifying Discord OAuth2 handshake.',
};

export default function DiscordCallbackLayout({
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
