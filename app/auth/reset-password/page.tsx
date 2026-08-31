"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

function ResetPasswordContent() {
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
      router.replace('/');
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
        router.push('/?notice=password_reset_success');
      } else {
        setErrorMessage(res.message || 'Failed to reset password.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen w-full bg-[#090909] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#E11D2E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-[#E11D2E] opacity-[0.08] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-[#5865F2] opacity-[0.05] blur-[180px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#111111]/90 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl relative z-10 shadow-2xl shadow-black/80"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-white/10">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-black p-1.5 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.3)]">
            <Image
              src="/visuals/LOGO_FOR_STAFFS.png"
              alt="RNG Network"
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
              RNG NETWORK
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">Security Credential Update</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-[#E11D2E] border border-red-500/20">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Set New Password</h2>
            <p className="text-xs text-zinc-400">
              {userEmail ? `For account ${userEmail}` : 'Choose a strong, unique password'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="my-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
              New Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-11 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors" size={17} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-11 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Strength & Parity Checklist */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
              <span>Password Strength</span>
              <span className={strengthScore >= 3 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    strengthScore >= level
                      ? strengthScore >= 3
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <CheckCircle2 size={13} className={hasMinLength ? 'opacity-100' : 'opacity-40'} />
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <CheckCircle2 size={13} className={passwordsMatch ? 'opacity-100' : 'opacity-40'} />
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!hasMinLength || !passwordsMatch || isLoading}
            className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-bold shadow-[0_0_20px_rgba(225,29,46,0.3)] transition-all mt-2"
          >
            <ShieldCheck size={18} className="mr-2" />
            Update Password
          </Button>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('resetPasswordToken');
              sessionStorage.removeItem('resetPasswordEmail');
              router.push('/');
            }}
            className="text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors pt-2"
          >
            <ArrowLeft size={14} /> Cancel & Return to Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#090909] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#E11D2E] rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
