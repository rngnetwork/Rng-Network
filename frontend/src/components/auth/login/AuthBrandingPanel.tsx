'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/common/feedback/Badge';

export interface AuthBrandingPanelProps {
  mode: 'welcome' | 'login' | 'register';
  step?: 'email' | 'whitelist' | 'discord' | 'forgot-password';
}

export const AuthBrandingPanel: React.FC<AuthBrandingPanelProps> = ({ mode, step = 'email' }) => {
  const getBrandingDetails = () => {
    if (step === 'whitelist') {
      return {
        title: 'Clearance Verification',
        desc: 'Validating personnel rank and asserting active ministry clearance.',
        badge: 'Ministry Whitelist',
      };
    }
    if (step === 'discord') {
      return {
        title: 'Discord 2FA Identity',
        desc: 'Confirming Discord snowflake ownership to authorize command access.',
        badge: 'Two-Factor Gateway',
      };
    }
    if (step === 'forgot-password') {
      return {
        title: 'Identity Recovery',
        desc: 'Cryptographic account recovery via whitelisted Discord verification.',
        badge: 'Password Reset',
      };
    }
    return {
      title: mode === 'login' ? 'Network Login' : 'Clearance Onboarding',
      desc:
        mode === 'login'
          ? 'Sign in with your whitelisted credentials to access the command center.'
          : 'Verify your ministry assignment and link your Discord snowflake.',
      badge: 'Secured Gateway',
    };
  };

  const branding = getBrandingDetails();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#0E0E12] opacity-100 overflow-hidden">
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
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-[200px] h-[200px] mb-6 relative flex items-center justify-center cursor-pointer select-none"
            style={{
              filter:
                'drop-shadow(0 0 25px rgba(225, 29, 46, 0.95)) drop-shadow(0 0 50px rgba(225, 29, 46, 0.6))',
            }}
          >
            <Image
              priority
              src="/assets/RNG_MAIN_LOGO_TRANSPARENT.png"
              alt="RNG Logo"
              width={200}
              height={200}
              unoptimized
              className="object-contain w-[200px] h-[200px]"
            />
          </motion.div>
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
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-[200px] h-[200px] mb-6 relative flex items-center justify-center cursor-pointer select-none"
            style={{
              filter:
                'drop-shadow(0 0 25px rgba(225, 29, 46, 0.95)) drop-shadow(0 0 50px rgba(225, 29, 46, 0.6))',
            }}
          >
            <Image
              priority
              src="/assets/staff.png"
              alt="Personnel Identity"
              width={200}
              height={200}
              unoptimized
              className="object-contain w-[200px] h-[200px]"
            />
          </motion.div>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-2xl font-bold text-content-primary mb-2 tracking-tight">
              {branding.title}
            </h2>
            <p className="text-content-secondary text-sm max-w-[240px] mb-6">
              {branding.desc}
            </p>
            <Badge variant="brand" dot>
              {branding.badge}
            </Badge>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
