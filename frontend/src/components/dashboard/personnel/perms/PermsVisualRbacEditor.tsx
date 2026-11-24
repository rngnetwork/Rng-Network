'use client';

import React, { useMemo, useState } from 'react';
import { Accordion, AccordionItem } from '@/components/common/navigation/Accordion';
import { PermsVisualRbacGroup } from './PermsVisualRbacGroup';
import { formatPermKey } from './permsTextFormatter';
import type { PermsRoleSchema } from './types';
import type { ServerItem } from '@/lib/model/server';

export interface PermsVisualRbacEditorProps {
  schema: PermsRoleSchema;
  onTogglePermission: (path: string[], enabled: boolean) => void;
  searchQuery?: string;
  servers?: ServerItem[];
}

const NON_EXPANDABLE_KEYS = new Set([
  'dashboard',
  'dashboard.embeds',
  'dashboard.botconfig',
  'dashboard.account',
]);

export const PermsVisualRbacEditor: React.FC<PermsVisualRbacEditorProps> = ({
  schema,
  onTogglePermission,
  searchQuery = '',
  servers,
}) => {
  const permissionsEntries = useMemo(() => {
    const raw = Object.entries(schema.permissions || {});
    const q = searchQuery.trim().toLowerCase();
    if (!q) return raw;

    return raw.filter(([key]) => {
      const formatted = formatPermKey(key).toLowerCase();
      return key.toLowerCase().includes(q) || formatted.includes(q);
    });
  }, [schema.permissions, searchQuery]);

  const [openIds, setOpenIds] = useState<string[]>(() =>
    permissionsEntries
      .map(([k]) => k)
      .filter((k) => !NON_EXPANDABLE_KEYS.has(k))
  );

  const accordionItems: AccordionItem[] = useMemo(() => {
    return permissionsEntries.map(([key, val]) => {
      const dataObj = (typeof val === 'object' && val !== null ? val : {}) as Record<string, unknown>;
      const isEnabled = dataObj.enabled !== undefined ? Boolean(dataObj.enabled) : true;
      const hasHeaderToggle = key !== 'dashboard.servers';
      const isNonExpandable = NON_EXPANDABLE_KEYS.has(key);

      return {
        id: key,
        title: (
          <div
            className="flex items-center justify-between w-full pr-2 gap-3"
            {...(isNonExpandable ? { 'data-no-chevron': 'true' } : {})}
          >
            <span className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate">
              {formatPermKey(key)}
            </span>
            {hasHeaderToggle && (
              <span
                role="switch"
                tabIndex={0}
                aria-checked={isEnabled}
                aria-label={`Toggle ${formatPermKey(key)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePermission([key, 'enabled'], !isEnabled);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    onTogglePermission([key, 'enabled'], !isEnabled);
                  }
                }}
                className={`relative inline-flex items-center flex-shrink-0 transition-colors duration-200 ease-in-out rounded-full border border-transparent outline-none cursor-pointer w-9 h-5 px-0.5 ${
                  isEnabled ? 'bg-brand-red shadow-sm shadow-brand-red/30' : 'bg-white/[0.12]'
                }`}
              >
                <span
                  className={`inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out pointer-events-none w-4 h-4 ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            )}
          </div>
        ),
        content: isNonExpandable ? null : (
          <PermsVisualRbacGroup
            parentKey={key}
            data={dataObj}
            parentEnabled={isEnabled}
            onToggle={onTogglePermission}
            servers={servers}
          />
        ),
      };
    });
  }, [permissionsEntries, onTogglePermission, servers]);

  if (permissionsEntries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <Accordion
        items={accordionItems}
        allowMultiple={true}
        openIds={openIds}
        onOpenIdsChange={(next) => {
          setOpenIds(next.filter((k) => !NON_EXPANDABLE_KEYS.has(k)));
        }}
        className="bg-surface-card border-surface-border divide-surface-border/50 rounded-apple-xl shadow-apple-card"
        headerClassName="p-4 [&:has([data-no-chevron])>svg]:hidden [&:has([data-no-chevron])]:cursor-default"
        contentClassName="p-4 bg-surface-canvas/30"
      />
    </div>
  );
};
