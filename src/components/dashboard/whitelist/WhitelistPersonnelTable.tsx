'use client';

import React from 'react';
import Image from 'next/image';
import { Edit3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getDiscordAvatarUrl } from '@/lib/api/auth/discord';
import type { WhitelistedUser, PersonnelHierarchyMap } from '@/lib/model/whitelist';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';

export interface WhitelistPersonnelTableProps {
  users: WhitelistedUser[];
  hierarchy: PersonnelHierarchyMap;
  canEditMember: (member: WhitelistedUser) => boolean;
  canDeleteMember: (member: WhitelistedUser) => boolean;
  onEditMember: (member: WhitelistedUser) => void;
  onDeleteMember: (member: WhitelistedUser) => void;
}

export const WhitelistPersonnelTable: React.FC<WhitelistPersonnelTableProps> = ({
  users,
  hierarchy,
  canEditMember,
  canDeleteMember,
  onEditMember,
  onDeleteMember,
}) => {
  return (
    <div className="overflow-hidden rounded-apple-xl bg-zinc-900/70 border border-white/[0.08] backdrop-blur-xl shadow-apple-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="text-[11px] uppercase tracking-wider text-zinc-500 bg-white/[0.02] border-b border-white/[0.06] font-mono">
            <tr>
              <th className="py-4 px-6">Personnel Member</th>
              <th className="py-4 px-6">Provider</th>
              <th className="py-4 px-6">Designations</th>
              <th className="py-4 px-6">Department Roles</th>
              <th className="py-4 px-6">Discord 2FA</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                  No whitelisted personnel found matching current filters.
                </td>
              </tr>
            ) : (
              users.map((member) => {
                const avatar = getDiscordAvatarUrl(member.discordId, member.discordAvatar);
                const isUserChiefHighCommand =
                  member.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
                  member.roles.some((r) => {
                    const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
                    return pure.toLowerCase() === 'chief high command';
                  });

                const isUserHighCommand =
                  isUserChiefHighCommand ||
                  member.role === 'ROLE_HIGH_COMMAND' ||
                  member.roles.some((r) => {
                    const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
                    return pure.toLowerCase() === 'high command';
                  });

                return (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-apple-md overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                          <Image
                            src={avatar}
                            alt={member.userName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-white truncate flex items-center gap-2">
                            {member.userName}
                            {isUserChiefHighCommand ? (
                              <Badge variant="crimson">CHC</Badge>
                            ) : isUserHighCommand ? (
                              <Badge variant="crimson">HC</Badge>
                            ) : null}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono truncate">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant="neutral">{member.provider}</Badge>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {member.designations.map((d) => (
                          <Badge key={d} variant="crimson">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 max-w-sm">
                        {member.designations.map((d) => {
                          const deptRoles = member.roles
                            .filter(
                              (r) =>
                                r.startsWith(`${d}:`) ||
                                (!r.includes(':') && (hierarchy[d] || []).includes(r))
                            )
                            .map((r) => (r.startsWith(`${d}:`) ? r.replace(`${d}:`, '') : r));
                          if (deptRoles.length === 0) return null;
                          const deptShort = d.startsWith('Ministry of ')
                            ? d.replace('Ministry of ', '')
                            : d;
                          return (
                            <div
                              key={d}
                              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md bg-white/[0.03] border border-white/10 w-fit"
                            >
                              <span className="text-zinc-400 font-mono text-[10px]">
                                {deptShort}:
                              </span>
                              <span className="text-white font-medium">
                                {deptRoles.join(', ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {member.discordLinked ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                          <CheckCircle2 size={14} />
                          <span>Linked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                          <AlertCircle size={14} />
                          <span>Pending</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditMember(member) && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onEditMember(member)}
                            aria-label={`Edit ${member.userName}`}
                          >
                            <Edit3 size={14} />
                          </Button>
                        )}
                        {canDeleteMember(member) && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => onDeleteMember(member)}
                            aria-label={`Revoke ${member.userName}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
