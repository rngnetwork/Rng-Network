import React, { Suspense } from 'react';
import { TwoFactorForm } from '@/components/auth/2fa/TwoFactorForm';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<RngLoadingSpinner size="md" label="Loading Two-Factor Challenge..." />}>
      <TwoFactorForm />
    </Suspense>
  );
}
