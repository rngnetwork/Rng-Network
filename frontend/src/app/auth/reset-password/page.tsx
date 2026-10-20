import React, { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password/ResetPasswordForm';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<RngLoadingSpinner size="md" label="Loading Password Recovery..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
