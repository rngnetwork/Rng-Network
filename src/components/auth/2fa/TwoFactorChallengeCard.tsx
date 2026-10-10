'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/common/containers/Card';
import { Button } from '@/components/common/input/Button';
import { DiscordVerificationBadge } from './DiscordVerificationBadge';

export const TwoFactorChallengeCard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const userEmail = searchParams.get('email');
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('pre2FaToken', token);
      if (userEmail) sessionStorage.setItem('pre2FaEmail', userEmail);
    }
  }, [token, userEmail]);

  const handleConnectDiscord = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1536703659734339634';
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
        'http://localhost:3000/auth/discord/callback'
    );
    window.open(
      `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`,
      '_self'
    );
  };

  if (error) {
    return (
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
          <AlertCircle className="text-red-500" size={34} />
        </div>
        <h2 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
          Google Sign-In Error
        </h2>
        <p className="text-red-400 text-sm mb-6">
          {errorMessage ||
            (error === 'user_not_whitelisted'
              ? 'Your Google email is not authorized or whitelisted in the system.'
              : 'Authentication with Google failed.')}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/auth/login')}
          className="w-full min-h-[44px]"
        >
          Back to Sign In
        </Button>
      </Card>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-border-subtle border-t-brand-red rounded-full animate-spin mb-4" />
        <p className="text-sm text-content-secondary">Validating Step 1 Credentials...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md p-8 text-center flex flex-col gap-5">
      <DiscordVerificationBadge userEmail={userEmail || 'Whitelisted Operator'} />
      <div>
        <h2 className="text-2xl font-bold text-content-primary tracking-tight mb-2">
          Step 1 Authenticated
        </h2>
        <p className="text-content-secondary text-sm">
          Complete mandatory Discord Snowflake 2FA verification to unlock the RNG Control Center.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        onClick={handleConnectDiscord}
        className="w-full min-h-[44px]"
      >
        Connect with Discord OAuth2
      </Button>
      <button
        type="button"
        onClick={() => router.push('/auth/login')}
        className="text-xs text-content-muted hover:text-content-primary transition-colors"
      >
        Cancel and return to sign in
      </button>
    </Card>
  );
};
