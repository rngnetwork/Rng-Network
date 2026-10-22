'use client';

import React from 'react';
import { Layers, Shield } from 'lucide-react';
import type { UserProfileData } from '@/lib/model/user';
import type { PersonnelHierarchyMap } from '@/lib/model/whitelist';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface PersonnelClearanceCardProps {
  user: UserProfileData;
  hierarchy: PersonnelHierarchyMap;
}

export const PersonnelClearanceCard: React.FC<PersonnelClearanceCardProps> = ({
  user,
  hierarchy,
}) => {
  const designations = user.designationList ?? [];
  const roleTokens = user.roleList ?? [];

  return (
    <Card
      title="Personnel Hierarchy & Clearances"
      subtitle="Assigned ministry designations and rank authorities"
      headerAction={
        <div className="p-2 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
          <Layers size={18} />
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Cryptographic Ministry Boundary Enforcement Active</span>
          <Shield size={14} className="text-brand-red" />
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        {designations.length > 0 ? (
          designations.map((des) => {
            const roles = roleTokens
              .filter(
                (r) =>
                  r.startsWith(`${des}:`) ||
                  (!r.includes(':') && (hierarchy[des] || []).includes(r))
              )
              .map((r) => (r.startsWith(`${des}:`) ? r.replace(`${des}:`, '') : r));

            return (
              <div
                key={des}
                className="flex items-center justify-between p-3.5 rounded-apple-md bg-white/[0.02] border border-white/[0.06]"
              >
                <span className="text-xs text-red-300 font-semibold flex items-center gap-2 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                  {des}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <Badge key={r} variant="neutral">
                        {r}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Standard Operative</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 rounded-apple-md bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400">
            {user.designations || 'Standard Personnel Clearance'}
          </div>
        )}
      </div>
    </Card>
  );
};
