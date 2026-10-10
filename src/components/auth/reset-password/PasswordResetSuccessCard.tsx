'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface PasswordResetSuccessCardProps {
  strengthScore: number;
  hasMinLength: boolean;
  passwordsMatch: boolean;
}

export const PasswordResetSuccessCard: React.FC<PasswordResetSuccessCardProps> = ({
  strengthScore,
  hasMinLength,
  passwordsMatch,
}) => {
  const strengthLabel =
    strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : strengthScore === 3 ? 'Good' : 'Strong';

  return (
    <div className="bg-surface-subtle border border-border-subtle rounded-control p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] font-mono text-content-secondary">
        <span>Password Strength</span>
        <span
          className={
            strengthScore >= 3
              ? 'text-emerald-400 font-bold'
              : strengthScore === 2
                ? 'text-amber-400 font-bold'
                : 'text-content-muted'
          }
        >
          {strengthLabel}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 rounded-full transition-colors ${
              strengthScore >= level
                ? strengthScore >= 3
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
                : 'bg-surface-elevated'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs pt-0.5">
        <div
          className={`flex items-center gap-1.5 ${
            hasMinLength ? 'text-emerald-400' : 'text-content-muted'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>8+ characters</span>
        </div>
        <div
          className={`flex items-center gap-1.5 ${
            passwordsMatch ? 'text-emerald-400' : 'text-content-muted'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Passwords match</span>
        </div>
      </div>
    </div>
  );
};
