'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/input/Button';
import { TextInput } from '@/components/common/input/TextInput';
import { Alert } from '@/components/common/feedback/Alert';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { api } from '@/lib/api';
import { PasswordResetSuccessCard } from './PasswordResetSuccessCard';

export const PasswordResetForm: React.FC = () => {
  const router = useRouter();
  const [resetToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('resetPasswordToken');
    }
    return null;
  });
  const [userEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('resetPasswordEmail') || '';
    }
    return '';
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!resetToken) {
      router.replace('/auth/login');
    }
  }, [resetToken, router]);

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.resetPassword(resetToken, password);
      if (res.success) {
        sessionStorage.removeItem('resetPasswordToken');
        sessionStorage.removeItem('resetPasswordEmail');
        router.push('/auth/login?notice=password_reset_success');
      } else {
        setErrorMessage(res.message || 'Failed to reset password.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RngLoadingSpinner size="lg" label="Validating Reset Clearance..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full justify-center p-6 md:p-10 bg-surface-card text-content-primary">
      <button
        type="button"
        onClick={() => {
          sessionStorage.removeItem('resetPasswordToken');
          sessionStorage.removeItem('resetPasswordEmail');
          router.push('/auth/login');
        }}
        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-white transition-all duration-200 w-fit mb-4 min-h-[36px] px-2 py-1 -ml-2 rounded-apple-sm hover:bg-white/[0.06] cursor-pointer"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span>Back to Sign In</span>
      </button>

      <div className="w-12 h-12 bg-brand-subtle border border-brand-red/30 rounded-card flex items-center justify-center mb-3 text-brand-red">
        <Lock size={22} />
      </div>

      <h3 className="text-2xl font-extrabold text-content-primary tracking-tight mb-1">
        Set New Password
      </h3>
      <p className="text-content-secondary text-xs mb-4">
        {userEmail ? `For account ${userEmail}` : 'Enter your new password below.'}
      </p>

      {errorMessage && (
        <div className="mb-3">
          <Alert variant="danger" title="Validation Error" description={errorMessage} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        <TextInput
          type={showPassword ? 'text' : 'password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password (min. 8 chars)"
          aria-label="New Password"
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

        <TextInput
          type={showConfirmPassword ? 'text' : 'password'}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm New Password"
          aria-label="Confirm New Password"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="text-content-muted hover:text-content-primary p-1"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <PasswordResetSuccessCard
          strengthScore={strengthScore}
          hasMinLength={hasMinLength}
          passwordsMatch={passwordsMatch}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={!hasMinLength || !passwordsMatch || isLoading}
          leftIcon={<ShieldCheck size={16} />}
          className="w-full min-h-[44px]"
        >
          Update Password
        </Button>
      </form>
    </div>
  );
};
