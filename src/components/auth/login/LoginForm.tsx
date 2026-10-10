'use client';

import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/input/Button';
import { TextInput } from '@/components/common/input/TextInput';
import { Alert } from '@/components/common/feedback/Alert';
import { api } from '@/lib/api';

export interface LoginFormProps {
  onBack?: () => void;
  resetSuccessNotice?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onBack, resetSuccessNotice = false }) => {
  const [step, setStep] = useState<'email' | 'whitelist' | 'discord' | 'forgot-password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.submitEmailLogin(email, password);
      if (res.success && res.data?.token) {
        sessionStorage.setItem('pre2FaToken', res.data.token);
        setIsWhitelisted(true);
        setStep('whitelist');
      } else {
        setErrorMessage(res.message || 'Invalid credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = () => {
    api.redirectToGoogle();
  };

  const handleDiscordSubmit = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1536703659734339634';
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
        (typeof window !== 'undefined'
          ? `${window.location.origin}/auth/discord/callback`
          : 'http://localhost:3000/auth/discord/callback')
    );
    window.open(
      `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`,
      '_self'
    );
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.initiateForgotPassword(forgotEmail);
      if (res.success && res.data?.discordAuthUrl) {
        window.open(res.data.discordAuthUrl, '_self');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate password reset.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (step === 'forgot-password' || step === 'whitelist') {
      setStep('email');
    } else if (step === 'discord') {
      setStep('whitelist');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 md:p-10 bg-surface-card text-content-primary relative">
      {(onBack || step !== 'email') && (
        <button
          type="button"
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors w-fit mb-4 min-h-[36px]"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
      )}

      {step === 'email' && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-content-primary tracking-tight">Sign In</h3>
            <p className="text-content-secondary text-xs mt-1">
              Use your whitelisted network email or continue with Google.
            </p>
          </div>

          {resetSuccessNotice && (
            <Alert
              variant="success"
              title="Password Updated"
              description="Your password was reset. Sign in with your new credentials."
            />
          )}

          {errorMessage && <Alert variant="danger" title="Sign-In Failed" description={errorMessage} />}

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSubmit}
            disabled={isLoading}
            className="w-full min-h-[44px]"
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-content-muted text-[11px] font-mono uppercase">OR</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <TextInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Network Email"
              aria-label="Network Email"
              leftIcon={<Mail size={16} />}
            />

            <TextInput
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-content-muted hover:text-content-primary p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError(null);
                  setStep('forgot-password');
                }}
                className="text-xs font-medium text-content-secondary hover:text-brand-red transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" variant="primary" loading={isLoading} className="w-full min-h-[44px]">
              Continue
            </Button>
          </form>
        </div>
      )}

      {step === 'forgot-password' && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-content-primary tracking-tight">
              Password Recovery
            </h3>
            <p className="text-content-secondary text-xs mt-1">
              Enter your whitelisted email to verify identity via Discord OAuth2.
            </p>
          </div>

          {forgotError && <Alert variant="danger" title="Recovery Error" description={forgotError} />}

          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3">
            <TextInput
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Account Email (e.g. operator@rng.com)"
              aria-label="Account Email"
              leftIcon={<Mail size={16} />}
            />
            <Button type="submit" variant="primary" loading={forgotLoading} className="w-full min-h-[44px]">
              Verify with Discord
            </Button>
          </form>
        </div>
      )}

      {step === 'whitelist' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-extrabold text-content-primary tracking-tight">
            Clearance Check
          </h3>
          {isWhitelisted ? (
            <>
              <Alert
                variant="success"
                title="Whitelist Verified"
                description="Phase 1 credentials validated. Proceed to Discord 2FA verification."
              />
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep('discord')}
                className="w-full min-h-[44px]"
              >
                Continue to Discord 2FA
              </Button>
            </>
          ) : (
            <Alert
              variant="danger"
              title="Access Revoked"
              description="Your account is not on the RNG personnel whitelist."
            />
          )}
        </div>
      )}

      {step === 'discord' && (
        <div className="flex flex-col gap-4">
          <div className="w-12 h-12 rounded-card bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-content-primary tracking-tight">
              Connect Discord
            </h3>
            <p className="text-content-secondary text-xs mt-1">
              Confirm ownership of your linked Discord Snowflake ID to issue full command clearance.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={handleDiscordSubmit}
            loading={isLoading}
            className="w-full min-h-[44px]"
          >
            Connect with Discord OAuth2
          </Button>
        </div>
      )}
    </div>
  );
};
