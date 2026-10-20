'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setStoredAccessToken } from '@/lib/api';
import { OAuthCallbackLoader } from './OAuthCallbackLoader';
import { OAuthErrorNotice } from './OAuthErrorNotice';

export const DiscordCallbackHandler: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResetFlow, setIsResetFlow] = useState(false);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const processDiscordCallback = async () => {
      if (hasExecutedRef.current) return;
      hasExecutedRef.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const pre2FaToken = sessionStorage.getItem('pre2FaToken');
      const redirectUri =
        process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
        (typeof window !== 'undefined'
          ? `${window.location.origin}/auth/discord/callback`
          : 'http://localhost:3000/auth/discord/callback');

      if (!code) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Missing Discord authorization code parameter.');
        }
        return;
      }

      if (state) {
        if (isMounted) setIsResetFlow(true);
        try {
          const res = await api.verifyForgotPasswordDiscord(code, state);
          if (res.success && res.data?.resetToken) {
            sessionStorage.setItem('resetPasswordToken', res.data.resetToken);
            sessionStorage.setItem('resetPasswordEmail', res.data.email);
            if (isMounted) {
              setStatus('success');
              setTimeout(() => {
                router.push('/auth/reset-password');
              }, 800);
            }
            return;
          }
          if (isMounted) {
            setStatus('error');
            setErrorMessage(res.message || 'Discord verification for password recovery failed.');
          }
          return;
        } catch (err: unknown) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(
              err instanceof Error
                ? err.message
                : 'Discord verification for password recovery failed.'
            );
          }
          return;
        }
      }

      if (!pre2FaToken) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Pre-2FA authentication token missing or expired. Please sign in again.');
        }
        return;
      }

      try {
        const res = await api.submitDiscord2Fa(pre2FaToken, code, redirectUri);
        if (res.success && res.data?.accessToken) {
          setStoredAccessToken(res.data.accessToken);
          sessionStorage.removeItem('pre2FaToken');
          if (isMounted) {
            setStatus('success');
            setTimeout(() => {
              router.push('/dashboard');
            }, 900);
          }
        } else if (isMounted) {
          setStatus('error');
          setErrorMessage(res.message || 'Discord 2FA verification failed.');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'An error occurred during 2FA upgrade.'
          );
        }
      }
    };

    processDiscordCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <OAuthErrorNotice
        message={errorMessage}
        onRetry={() => router.push('/auth/login')}
      />
    );
  }

  return <OAuthCallbackLoader status={status} isResetFlow={isResetFlow} />;
};
