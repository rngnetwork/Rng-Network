'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { getDiscordAvatarUrl } from '@/lib/api/auth/discord';
import type { UserProfileData } from '@/lib/model/user';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface AccountProfileDetailsProps {
  user: UserProfileData;
  rankWeight?: number;
}

export const AccountProfileDetails: React.FC<AccountProfileDetailsProps> = ({ user, rankWeight }) => {
  const [avatarError, setAvatarError] = useState(false);
  const avatarUrl = avatarError
    ? '/assets/staff.png'
    : getDiscordAvatarUrl(user.discordId, user.discordAvatar);

  const isLegacyHighCommand =
    user.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
    user.role === 'ROLE_HIGH_COMMAND' ||
    user.roles?.includes('High Command') ||
    user.designations?.includes('Supreme');
  const isLegacyMinister =
    user.role === 'ROLE_MINISTER' ||
    user.roles?.includes('Minister') ||
    user.designations?.includes('Ministry');

  const badgeVariant =
    typeof rankWeight === 'number' && rankWeight > 0
      ? rankWeight >= 8
        ? 'crimson'
        : rankWeight >= 5
        ? 'warning'
        : 'neutral'
      : isLegacyHighCommand
      ? 'crimson'
      : isLegacyMinister
      ? 'warning'
      : 'neutral';

  const clearanceLabel =
    typeof rankWeight === 'number' && rankWeight > 0 ? `Rank R${rankWeight}` : user.role;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-apple-xl overflow-hidden border-2 border-brand-red/30 shadow-crimson-glow shrink-0">
            <Image
              src={avatarUrl}
              alt={user.fullName || user.email}
              fill
              unoptimized
              className="object-cover"
              onError={() => setAvatarError(true)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {user.fullName || user.email.split('@')[0]}
              </h2>
              <Badge variant={badgeVariant}>
                {clearanceLabel}
              </Badge>
            </div>

            <span className="text-sm text-zinc-400 font-mono">{user.email}</span>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="neutral">
                <KeyRound size={12} className="text-brand-red mr-1 inline" />
                Provider: {user.provider || 'EMAIL'}
              </Badge>
              <Badge variant="success">
                <CheckCircle2 size={12} className="mr-1 inline" />
                Status: {user.status || 'ACTIVE'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4 rounded-apple-lg bg-white/[0.02] border border-white/[0.06] min-w-[260px]">
          <div className="flex items-center gap-2 text-xs font-semibold text-white pb-2 border-b border-white/[0.06]">
            <Lock size={14} className="text-indigo-400" />
            <span>Discord 2FA Hardware Guard</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">2FA Status</span>
            <Badge variant={user.discordLinked ? 'success' : 'warning'}>
              {user.discordLinked ? 'LINKED & VERIFIED' : 'PENDING'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Discord Handle</span>
            <span className="font-mono text-indigo-300">
              {user.discordUsername ? `@${user.discordUsername}` : 'Authenticated'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Snowflake ID</span>
            <span className="font-mono text-zinc-300">{user.discordId || 'N/A'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
