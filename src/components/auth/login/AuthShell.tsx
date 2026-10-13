'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { AuthBackgroundEffects } from './AuthBackgroundEffects';
import { AuthBrandingPanel } from './AuthBrandingPanel';
import { LoginForm, type LoginStep } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export const AuthShell: React.FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<'welcome' | 'login'>('welcome');
  const [loginStep, setLoginStep] = useState<LoginStep>('email');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [resetSuccessNotice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('notice') === 'password_reset_success';
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      let token = localStorage.getItem('rng_access_token') || localStorage.getItem('accessToken');

      if (token) {
        try {
          const userRes = await api.fetchCurrentUser(token);
          if (userRes.success && userRes.data) {
            router.push('/dashboard');
            return;
          }
        } catch {
          localStorage.removeItem('rng_access_token');
          localStorage.removeItem('accessToken');
          token = null;
        }
      }

      if (!token) {
        try {
          const refreshRes = await api.refreshToken();
          if (refreshRes.success && refreshRes.data?.accessToken) {
            router.push('/dashboard');
            return;
          }
        } catch {
          // Session not active
        }
      }

      if (isMounted) {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isCheckingSession) {
    return <RngLoadingSpinner fullScreen size="xl" label="Verifying Personnel Clearance..." />;
  }

  // Alternating column choreography:
  // 1. Initial Screen (mode = 'welcome'): Left = Gateway Form, Right = Branding Panel
  // 2. On "Sign In to RAC" (step = 'email'): Left = Branding Panel, Right = Credential Form (SWAP 1)
  // 3. On "Continue" Submit (step = 'whitelist'): Left = Clearance Check Form, Right = Branding Panel (SWAP 2)
  // 4. On "Continue to Discord 2FA" (step = 'discord'): Left = Branding Panel, Right = Discord Connect Form (SWAP 3)
  const isFormOnLeft = mode === 'welcome' ? true : loginStep === 'whitelist';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-canvas relative overflow-hidden p-4">
      <AuthBackgroundEffects />

      <div className="hidden md:block w-full max-w-[860px] mx-auto relative z-10">
        <motion.div
          layout
          className="w-full min-h-[500px] bg-surface-card rounded-modal shadow-elevated border border-border-strong overflow-hidden flex flex-row relative"
        >
          <motion.div
            layout
            key="auth-form-column"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-1/2 flex flex-col justify-center ${
              isFormOnLeft
                ? 'order-1 border-r border-border-subtle'
                : 'order-2'
            }`}
          >
            <motion.div
              key={`${mode}-${loginStep}`}
              initial={{ opacity: 0, x: isFormOnLeft ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {mode === 'welcome' ? (
                <RegisterForm
                  onSelectLogin={() => {
                    setMode('login');
                    setLoginStep('email');
                  }}
                />
              ) : (
                <LoginForm
                  onBack={() => {
                    setMode('welcome');
                    setLoginStep('email');
                  }}
                  step={loginStep}
                  onStepChange={setLoginStep}
                  resetSuccessNotice={resetSuccessNotice}
                />
              )}
            </motion.div>
          </motion.div>
          <motion.div
            layout
            key="auth-branding-column"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-1/2 flex flex-col ${
              isFormOnLeft
                ? 'order-2'
                : 'order-1 border-r border-border-subtle'
            }`}
          >
            <AuthBrandingPanel mode={mode} step={loginStep} />
          </motion.div>
        </motion.div>
      </div>

      <div className="flex md:hidden w-full max-w-md rounded-modal shadow-elevated border border-border-strong bg-surface-card overflow-hidden relative z-10">
        <LoginForm
          resetSuccessNotice={resetSuccessNotice}
          step={loginStep}
          onStepChange={setLoginStep}
        />
      </div>
    </div>
  );
};
