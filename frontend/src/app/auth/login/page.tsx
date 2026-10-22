import React, { Suspense } from 'react';
import { AuthShell } from '@/components/auth/login/AuthShell';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export default function LoginPage() {
  return (
    <Suspense fallback={<RngLoadingSpinner fullScreen size="lg" label="Loading Authentication..." />}>
      <AuthShell />
    </Suspense>
  );
}
