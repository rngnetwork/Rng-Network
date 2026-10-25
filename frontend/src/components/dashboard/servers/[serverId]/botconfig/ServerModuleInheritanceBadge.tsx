'use client';

import React from 'react';
import { Badge } from '@/components/common/feedback/Badge';

export interface ServerModuleInheritanceBadgeProps {
  isOverridden: boolean;
  isEnabled: boolean;
  totalFieldsCount?: number;
}

export const ServerModuleInheritanceBadge: React.FC<ServerModuleInheritanceBadgeProps> = ({
  isOverridden,
  isEnabled,
  totalFieldsCount,
}) => {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {isOverridden ? (
        <Badge variant="warning" size="sm">
          Custom Server Override
        </Badge>
      ) : (
        <Badge variant="neutral" size="sm">
          Network Default
        </Badge>
      )}

      {isEnabled ? (
        <Badge variant="brand" size="sm">
          Active
        </Badge>
      ) : (
        <Badge variant="neutral" size="sm">
          Disabled
        </Badge>
      )}

      {totalFieldsCount !== undefined ? (
        <span className="text-[11px] font-mono text-text-tertiary hidden md:inline">
          {totalFieldsCount} setting{totalFieldsCount === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  );
};
