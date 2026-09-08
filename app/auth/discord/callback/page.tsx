"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

function DiscordCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processDiscord2Fa = async () => {
      const code = searchParams.get('code');
      const pre2FaToken = sessionStorage.getItem('pre2FaToken');

      if (!code) {
        setStatus('error');
        setErrorMessage('Missing Discord authorization code parameter.');
        return;
      }

      if (!pre2FaToken) {
        setStatus('error');
        setErrorMessage('Pre-2FA authentication token missing or expired. Please sign in again.');
        return;
      }

      try {
        const res = await api.submitDiscord2Fa(pre2FaToken, code);
        if (res.success && res.data?.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
          sessionStorage.removeItem('pre2FaToken');
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1200);
        } else {
          setStatus('error');
          setErrorMessage(res.message || 'Discord 2FA verification failed.');
        }
      } catch (err: unknown) {
        setStatus('error');
        const message = err instanceof Error ? err.message : 'An error occurred during 2FA upgrade.';
        setErrorMessage(message);
      }
    };

    processDiscord2Fa();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5865F2] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl relative z-10 shadow-2xl"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-white/10 border-t-[#5865F2] rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold tracking-tight mb-2">Verifying Discord 2FA</h2>
            <p className="text-[#A0A0A0] text-sm">Exchanging authorization code and upgrading security credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#3BA55D]/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="text-[#3BA55D]" size={36} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">2FA Verification Complete</h2>
            <p className="text-[#A0A0A0] text-sm">Account authenticated successfully. Loading dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#ED4245]/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="text-[#ED4245]" size={36} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">Authentication Error</h2>
            <p className="text-[#ED4245] text-sm mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function DiscordCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090909] flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#5865F2] rounded-full animate-spin" />
      </div>
    }>
      <DiscordCallbackContent />
    </Suspense>
  );
}
