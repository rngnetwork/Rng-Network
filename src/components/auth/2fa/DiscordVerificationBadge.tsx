'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/common/feedback/Badge';

export interface DiscordVerificationBadgeProps {
  userEmail?: string | null;
}

export const DiscordVerificationBadge: React.FC<DiscordVerificationBadgeProps> = ({
  userEmail,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 bg-[#5865F2]/15 border border-[#5865F2]/30 rounded-full flex items-center justify-center mx-auto">
        <ShieldCheck className="text-[#5865F2]" size={34} />
      </div>
      <Badge variant="brand" dot>
        SCOPE_PRE_2FA
      </Badge>
      {userEmail && (
        <p className="text-xs font-mono text-content-secondary">
          Identity: <span className="text-content-primary font-semibold">{userEmail}</span>
        </p>
      )}
    </div>
  );
};
