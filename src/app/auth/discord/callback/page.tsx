import React, { Suspense } from 'react';
import { DiscordCallbackHandler } from '@/components/auth/discord/callback/DiscordCallbackHandler';

export default function DiscordCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      }
    >
      <DiscordCallbackHandler />
    </Suspense>
  );
}
