'use client';

import React, { Suspense } from 'react';
import { AuthBrandingPanel } from '../login/AuthBrandingPanel';
import { PasswordResetForm } from './PasswordResetForm';

export const ResetPasswordForm: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-border-subtle border-t-brand-red rounded-full animate-spin" />
        </div>
      }
    >
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
