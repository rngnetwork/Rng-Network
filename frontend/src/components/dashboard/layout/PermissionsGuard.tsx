'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft, EyeOff } from 'lucide-react';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useEffectivePermissions } from './EffectivePermissionsContext';

export interface PermissionsGuardProps {
  children: React.ReactNode;
}

export const PermissionsGuard: React.FC<PermissionsGuardProps> = ({ children }) => {
  const pathname = usePathname() || '/dashboard';
  const {
    loading,
    isRouteAllowed,
    isPreviewMode,
    previewRoleName,
    exitPreviewMode,
  } = useEffectivePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RngLoadingSpinner size="lg" label="Verifying Clearance..." />
      </div>
    );
  }

  if (!isRouteAllowed(pathname)) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
      >
        <div className="max-w-md w-full p-8 rounded-apple-xl bg-surface-elevated/60 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-brand-red/15 border border-brand-red/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={24} className="text-brand-red" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted (403)</h2>
          <p className="text-sm text-text-secondary mb-6">
            {isPreviewMode
              ? `Simulated role (${previewRoleName || 'Preview'}) lacks clearance for ${pathname}.`
              : `Your assigned roles do not grant permission to access ${pathname}.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isPreviewMode && (
              <button
                type="button"
                onClick={() => {
                  void exitPreviewMode();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-apple-md bg-brand-red hover:bg-brand-red-hover text-white text-sm font-semibold transition-all shadow-crimson-glow cursor-pointer"
              >
                <EyeOff size={16} />
                Exit Preview
              </button>
            )}
            <Link
              href="/dashboard/account"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-apple-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-sm font-medium transition-all"
            >
              <ArrowLeft size={16} />
              Account Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
