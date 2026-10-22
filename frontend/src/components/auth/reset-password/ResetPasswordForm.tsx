'use client';

import React, { Suspense } from 'react';
import { AuthBrandingPanel } from '../login/AuthBrandingPanel';
import { PasswordResetForm } from './PasswordResetForm';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export const ResetPasswordForm: React.FC = () => {
  return (
    <Suspense fallback={<RngLoadingSpinner size="md" label="Loading Password Reset..." className="p-8" />}>
      <div className="w-full max-w-[850px] mx-auto bg-surface-card rounded-modal shadow-elevated border border-border-strong overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:block border-r border-border-subtle">
          <AuthBrandingPanel mode="login" />
        </div>
        <div>
          <PasswordResetForm />
        </div>
      </div>
    </Suspense>
  );
};
