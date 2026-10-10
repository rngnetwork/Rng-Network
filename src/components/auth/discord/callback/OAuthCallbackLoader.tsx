'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/common/containers/Card';

export interface OAuthCallbackLoaderProps {
  status: 'loading' | 'success';
  isResetFlow: boolean;
}

export const OAuthCallbackLoader: React.FC<OAuthCallbackLoaderProps> = ({
  status,
  isResetFlow,
}) => {
  return (
    <Card className="w-full max-w-md p-8 text-center">
      {status === 'loading' ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-border-subtle border-t-brand-red rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
            {isResetFlow ? 'Verifying Identity' : 'Verifying Discord 2FA'}
          </h2>
          <p className="text-content-secondary text-sm">
            {isResetFlow
              ? 'Confirming linked Discord account for password recovery...'
              : 'Exchanging authorization code and upgrading security credentials...'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="text-emerald-400" size={34} />
          </div>
          <h2 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
            {isResetFlow ? 'Identity Verified' : '2FA Verification Complete'}
          </h2>
          <p className="text-content-secondary text-sm">
            {isResetFlow
              ? 'Account verified. Redirecting to password reset...'
              : 'Account authenticated. Loading Control Center...'}
          </p>
        </div>
      )}
    </Card>
  );
};
