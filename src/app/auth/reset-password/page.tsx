import React, { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
