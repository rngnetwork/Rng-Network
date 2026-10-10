import React, { Suspense } from 'react';
import { TwoFactorForm } from '@/components/auth/2fa/TwoFactorForm';

export default function TwoFactorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      }
    >
      <TwoFactorForm />
    </Suspense>
  );
}
