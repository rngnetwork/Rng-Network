"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function Google2FaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const userEmail = searchParams.get('email');

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('pre2FaToken', token);
      if (userEmail) sessionStorage.setItem('pre2FaEmail', userEmail);
    }
  }, [token, userEmail]);

  const handleConnectDiscord = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1536703659734339634';
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback'
    );
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`;
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#E11D2E] rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#A0A0A0]">Validating Google Authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5865F2] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl relative z-10 shadow-2xl"
      >
        <div className="w-16 h-16 bg-[#5865F2]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
          <ShieldCheck className="text-[#5865F2]" size={36} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Step 1 Authenticated</h2>
        <p className="text-[#A0A0A0] text-sm mb-6">
          Signed in as <span className="text-white font-semibold">{userEmail || 'Google User'}</span>. Complete mandatory Discord 2FA to access dashboard.
        </p>

        <Button
          type="button"
          onClick={handleConnectDiscord}
          className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] !text-white font-bold shadow-[0_4px_14px_rgba(88,101,242,0.4)]"
        >
          Connect with Discord OAuth2
        </Button>

        <button
          onClick={() => router.push('/')}
          className="mt-4 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Cancel and return to sign in
        </button>
      </motion.div>
    </div>
  );
}

export default function Google2FaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090909] flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#5865F2] rounded-full animate-spin" />
      </div>
    }>
      <Google2FaContent />
    </Suspense>
  );
}
