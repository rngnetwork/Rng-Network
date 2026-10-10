'use client';

import React, { Suspense } from 'react';
import { TwoFactorChallengeCard } from './TwoFactorChallengeCard';

export const TwoFactorForm: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-border-subtle border-t-brand-red rounded-full animate-spin" />
        </div>
      }
    >
      <TwoFactorChallengeCard />
    </Suspense>
  );
};
