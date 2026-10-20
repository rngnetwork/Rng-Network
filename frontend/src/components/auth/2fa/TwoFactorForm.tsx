'use client';

import React, { Suspense } from 'react';
import { TwoFactorChallengeCard } from './TwoFactorChallengeCard';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export const TwoFactorForm: React.FC = () => {
  return (
    <Suspense fallback={<RngLoadingSpinner size="md" label="Loading Two-Factor Verification..." className="p-8" />}>
      <TwoFactorChallengeCard />
    </Suspense>
  );
};
