'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, ChevronRight } from 'lucide-react';
import { Card } from '@/components/common/containers/Card';

export interface RegisterFormProps {
  onSelectLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSelectLogin }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center p-6 md:p-10 bg-surface-card text-content-primary">
      <span className="text-brand-red text-xs font-mono font-bold tracking-widest uppercase mb-2">
        Secure Administration Portal
      </span>
      <h2 className="text-2xl md:text-3xl font-extrabold text-content-primary mb-2 tracking-tight">
        Welcome Back
      </h2>
      <p className="text-content-secondary text-sm mb-8 max-w-xs">
        Select an authentication pathway to enter the RNG Control Center.
      </p>

      <div className="flex flex-col gap-3.5">
        <motion.button
          type="button"
          onClick={onSelectLogin}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="group relative flex items-center justify-between p-4 min-h-[44px] rounded-card border border-border-strong bg-surface-elevated hover:border-brand-red hover:shadow-glow transition-all duration-200 text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-control bg-brand-red flex items-center justify-center shadow-glow shrink-0">
              <Shield className="text-white" size={22} />
            </div>
            <div>
              <h3 className="text-content-primary font-bold text-base">Sign In to RAC</h3>
              <p className="text-content-secondary text-xs">
                Authenticate via Email or Google OAuth2 + Discord 2FA
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-content-muted group-hover:text-brand-red group-hover:translate-x-0.5 transition-all"
          />
        </motion.button>

        <Card className="p-4 bg-surface-subtle/80 border-border-subtle">
          <div className="flex items-start gap-3">
            <KeyRound size={16} className="text-brand-red shrink-0 mt-0.5" />
            <div className="text-xs text-content-secondary leading-relaxed">
              <span className="font-semibold text-content-primary block mb-0.5">
                Whitelist Clearance Required
              </span>
              New personnel must be whitelisted by a Minister or High Command officer prior to
              initial login.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
