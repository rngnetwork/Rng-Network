import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password — RNG Control Center',
  description: 'Recover and reset your RNG Control Center credentials.',
};

export default function ResetPasswordLayout({
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
