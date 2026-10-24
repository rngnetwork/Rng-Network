'use client';

import React from 'react';

export interface ModuleInheritanceIndicatorProps {
  isOverridden: boolean;
  className?: string;
}

export const ModuleInheritanceIndicator: React.FC<ModuleInheritanceIndicatorProps> = ({
  isOverridden,
  className = '',
}) => {
  return (
    <span
      className={`text-[11px] font-mono select-none ${
        isOverridden ? 'text-zinc-300' : 'text-zinc-500'
      } ${className}`}
    >
      {isOverridden ? 'Server Override' : 'Network Default'}
    </span>
  );
};
