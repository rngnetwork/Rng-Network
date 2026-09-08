"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedGradient } from '@/components/background/AnimatedGradient';
import { api } from '@/lib/api';

const PARTICLES = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 100),
  y: ((i * 23 + 7) % 100),
  size: (i % 3) + 1.5,
  duration: 12 + (i % 8),
  delay: (i % 5) * 0.8,
}));

const BackgroundEffects = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black z-0">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: 'url("/visuals/apocalyptic_battlefield_bg.jpg")' }}
      />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-screen"
        style={{ backgroundImage: 'url("/visuals/RNG_Bannerr.gif")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#E11D2E]/10 via-transparent to-[#E11D2E]/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_black_100%)] opacity-90" />

      <div className="absolute inset-0 z-10">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-[#E11D2E] rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              boxShadow: '0 0 10px 2px rgba(225, 29, 46, 0.8)',
            }}
            animate={{
              y: ['0%', '-2000%'],
              opacity: [0, 1, 0],
              x: p.x % 2 === 0 ? ['0%', '100%'] : ['0%', '-100%']
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};

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
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#E11D2E] rounded-full animate-spin" />
      </div>
    );
  }

  const renderFormContent = (isMobile = false) => (
    <div className={`flex flex-col w-full h-full justify-center ${isMobile ? 'p-6' : 'p-6 md:p-10'} relative`}>
      <button
        type="button"
        onClick={() => {
          sessionStorage.removeItem('resetPasswordToken');
          sessionStorage.removeItem('resetPasswordEmail');
          router.push('/');
        }}
        className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 flex items-center gap-1.5 text-[14px] font-bold transition-colors w-fit"
      >
        <ArrowLeft size={16} strokeWidth={3} /> Back to Sign In
      </button>

      <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-3 mt-6 text-[#E11D2E] shadow-[0_0_20px_rgba(225,29,46,0.15)]">
        <Lock size={22} />
      </div>

      <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
        Set New Password
      </h3>
      <p className="text-slate-500 text-xs mb-4 leading-relaxed">
        {userEmail ? `For account ${userEmail}` : 'Enter your new password below.'}
      </p>

      {errorMessage && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-start gap-2 shadow-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
        {/* New Password */}
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={17} />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password (min. 8 chars)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[13px]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E11D2E] transition-colors" size={17} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E11D2E]/50 focus:bg-white focus:ring-4 focus:ring-[#E11D2E]/5 transition-all font-medium text-[13px]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {/* Strength & Checklist */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Password Strength</span>
            <span className={strengthScore >= 3 ? 'text-emerald-600 font-bold' : strengthScore === 2 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
              {strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  strengthScore >= level
                    ? strengthScore >= 3
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11.5px] px-1 pt-0.5">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
              <CheckCircle2 size={13} className={hasMinLength ? 'opacity-100 text-emerald-600' : 'opacity-40 text-slate-400'} />
              <span className="font-medium">8+ characters</span>
            </div>
            <div className={`flex items-center justify-end gap-1.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
              <CheckCircle2 size={13} className={passwordsMatch ? 'opacity-100 text-emerald-600' : 'opacity-40 text-slate-400'} />
              <span className="font-medium">Passwords match</span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!hasMinLength || !passwordsMatch || isLoading}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 border-none !text-white font-semibold !shadow-md hover:!shadow-[0_0_20px_rgba(225,29,46,0.5)] transition-all mt-1"
        >
          <ShieldCheck size={18} className="mr-2" />
          Update Password
        </Button>
      </form>
    </div>
  );

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-[#E11D2E]/30 selection:text-white p-4">
      <BackgroundEffects />

      {/* DESKTOP DUAL-PANEL LAYOUT */}
      <div className="hidden md:block w-full max-w-[850px] mx-auto z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full h-[510px] bg-white rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),0_0_40px_rgba(225,29,46,0.2)] overflow-hidden relative flex flex-row border border-slate-200/60"
        >
          {/* Left Branding Side */}
          <div className="w-1/2 relative bg-[#0A0A0A] z-10 h-full overflow-hidden flex flex-col items-center justify-center shrink-0 p-8 text-center">
            <style dangerouslySetInnerHTML={{__html: `
              .neon-red-outline-glow {
                filter: drop-shadow(0 0 2px #ff0033)
                       drop-shadow(0 0 5px #ff0033)
                       drop-shadow(0 0 8px rgba(255, 0, 51, 0.9))
                       drop-shadow(0 0 12px rgba(255, 0, 51, 0.65));
              }
            `}} />
            <AnimatedGradient />

            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-32 h-32 mb-6 relative flex items-center justify-center neon-red-outline-glow"
              >
                <div className="relative w-full h-full">
                  <Image priority src="/visuals/staff.png" alt="Staff Identity" fill unoptimized className="object-contain" />
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Security Portal
              </h2>
              <p className="text-white/60 text-[14px] font-medium max-w-[240px]">
                Update your account password to restore access to the administration portal.
              </p>
              
              <div className="mt-8 bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(225,29,46,0.2)]">
                Credential Update
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="w-1/2 flex flex-col relative h-full bg-white z-20 shrink-0">
            {renderFormContent(false)}
          </div>
        </motion.div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="flex md:hidden w-full max-w-md rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(225,29,46,0.2)] relative overflow-hidden border border-slate-200/60 bg-white z-20">
        {renderFormContent(true)}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#E11D2E] rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
