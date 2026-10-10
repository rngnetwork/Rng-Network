'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/common/feedback/Badge';

export interface AuthBrandingPanelProps {
  mode: 'welcome' | 'login' | 'register';
}

export const AuthBrandingPanel: React.FC<AuthBrandingPanelProps> = ({ mode }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-surface-canvas overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-red/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-brand-red/10 blur-3xl pointer-events-none" />

      {mode === 'welcome' ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-36 h-36 mb-6 relative flex items-center justify-center drop-shadow-[0_0_16px_rgba(225,29,46,0.65)]">
            <Image
              priority
              src="/assets/RNG_MAIN_LOGO_TRANSPARENT.png"
              alt="RNG Logo"
              width={144}
              height={144}
              unoptimized
              className="object-contain w-36 h-36"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest uppercase text-content-primary mb-3 leading-tight">
            RNG
            <br />
            <span className="text-brand-red">Administration</span>
          </h1>
          <div className="h-0.5 w-12 bg-brand-red rounded-full shadow-glow mt-1" />
        </motion.div>
      ) : (
        <motion.div
          key="auth-mode"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-28 h-28 mb-6 relative flex items-center justify-center drop-shadow-[0_0_16px_rgba(225,29,46,0.65)]">
            <Image
              priority
              src="/assets/staff.png"
              alt="Personnel Identity"
              width={112}
              height={112}
              unoptimized
              className="object-contain w-28 h-28"
            />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2 tracking-tight">
            {mode === 'login' ? 'Network Login' : 'Clearance Onboarding'}
          </h2>
          <p className="text-content-secondary text-sm max-w-[240px] mb-6">
            {mode === 'login'
              ? 'Sign in with your whitelisted credentials to access the command center.'
              : 'Verify your ministry assignment and link your Discord snowflake.'}
          </p>
          <Badge variant="brand" dot>
            Secured Gateway
          </Badge>
        </motion.div>
      )}
    </div>
  );
};
