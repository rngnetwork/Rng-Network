import React, { Suspense } from 'react';
import { DiscordCallbackHandler } from '@/components/auth/discord/callback/DiscordCallbackHandler';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={<RngLoadingSpinner size="lg" label="Processing Discord Authorization..." />}>
      <DiscordCallbackHandler />
    </Suspense>
  );
}
