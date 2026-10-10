import React, { Suspense } from 'react';
import { AuthShell } from '@/components/auth/login/AuthShell';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-canvas flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthShell />
    </Suspense>
  );
}
