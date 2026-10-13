'use client';

import React, { useState } from 'react';
import { Edit3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getDiscordAvatarUrl } from '@/lib/api/auth/discord';
import type { WhitelistedUser, PersonnelHierarchyMap } from '@/lib/model/whitelist';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';
import { Table, ColumnDef } from '@/components/common/containers/Table';
import { Avatar } from '@/components/common/feedback/Avatar';
import { Tooltip } from '@/components/common/feedback/Tooltip';
import { Checkbox } from '@/components/common/input/Checkbox';

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
  const [onlyDiscordLinked, setOnlyDiscordLinked] = useState(false);

  const filteredUsers = onlyDiscordLinked
    ? users.filter((u) => u.discordLinked)
    : users;

  const columns: ColumnDef<WhitelistedUser & Record<string, unknown>>[] = [
    {
      header: 'Personnel Member',
      cell: (member) => {
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
          <div className="flex items-center gap-3">
            <Avatar
              src={avatar}
              alt={member.userName}
              fallback={member.userName}
              size="md"
              status={member.discordLinked ? 'online' : 'offline'}
            />
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
        );
      },
      sortable: true,
      accessorKey: 'userName',
    },
    {
      header: 'Provider',
      accessorKey: 'provider',
      cell: (member) => <Badge variant="neutral">{member.provider}</Badge>,
      sortable: true,
    },
    {
      header: 'Designations',
      cell: (member) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {member.designations.map((d) => (
            <Badge key={d} variant="crimson">
              {d}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Department Roles',
      cell: (member) => (
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
      ),
    },
    {
      header: 'Discord 2FA',
      cell: (member) =>
        member.discordLinked ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <CheckCircle2 size={14} />
            <span>Linked</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
            <AlertCircle size={14} />
            <span>Pending</span>
          </div>
        ),
      sortable: true,
      accessorKey: 'discordLinked',
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (member) => (
        <div className="flex items-center justify-end gap-2">
          {canEditMember(member) && (
            <Tooltip content={`Edit clearance for ${member.userName}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onEditMember(member)}
                aria-label={`Edit ${member.userName}`}
              >
                <Edit3 size={14} />
              </Button>
            </Tooltip>
          )}
          {canDeleteMember(member) && (
            <Tooltip content={`Revoke whitelist access for ${member.userName}`}>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onDeleteMember(member)}
                aria-label={`Revoke ${member.userName}`}
              >
                <Trash2 size={14} />
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <Checkbox
          label="Filter 2FA Linked Personnel Only"
          checked={onlyDiscordLinked}
          onChange={(e) => setOnlyDiscordLinked(e.target.checked)}
        />
        <span className="text-xs text-zinc-500 font-mono">
          Showing {filteredUsers.length} of {users.length} members
        </span>
      </div>

      <Table<WhitelistedUser & Record<string, unknown>>
        data={filteredUsers as (WhitelistedUser & Record<string, unknown>)[]}
        columns={columns}
        emptyState={
          <div className="py-12 text-center text-zinc-500 font-medium">
            No whitelisted personnel found matching current filters.
          </div>
        }
      />
    </div>
  );
};
