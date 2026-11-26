'use client';

import React from 'react';
import { Accordion, AccordionItem } from '@/components/common/navigation/Accordion';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import type { PermsServerSummary } from '@/lib/model/personnel/perms';

export interface PermsVisualRbacGroupProps {
  parentKey: string;
  data: Record<string, unknown>;
  parentEnabled: boolean;
  onToggle: (path: string[], enabled: boolean) => void;
  servers?: PermsServerSummary[];
  labels?: Record<string, string>;
}

export const PermsVisualRbacGroup: React.FC<PermsVisualRbacGroupProps> = ({
  parentKey,
  data,
  parentEnabled,
  onToggle,
  servers,
  labels = {},
}) => {
  const resolveLabel = (key: string) => labels[key] ?? key;

  // 1. Dashboard : Servers -> Direct Accordion of Servers
  if (parentKey === 'dashboard.servers') {
    const serversMapKey =
      Object.keys(data).find((k) => k.toLowerCase().includes('[serverid]')) ||
      'dashboard.servers.[serverId]';
    const serversData = (data[serversMapKey] || {}) as Record<string, Record<string, unknown>>;

    const serverEntries =
      servers && servers.length > 0
        ? servers.map((s) => ({
            slug: s.slug,
            name: s.name,
            data: (serversData[s.slug] || {
              enabled: true,
              settings: { enabled: true },
              botconfig: { enabled: true },
              embeds: { enabled: true },
              analytics: { enabled: true },
            }) as Record<string, unknown>,
          }))
        : Object.entries(serversData).map(([slug, sObj]) => ({
            slug,
            name: resolveLabel(slug),
            data: (sObj || {}) as Record<string, unknown>,
          }));

    const serverAccordionItems: AccordionItem[] = serverEntries.map((srv) => {
      const isServerEnabled = srv.data?.enabled !== undefined ? Boolean(srv.data.enabled) : true;
      const subKeys = ['settings', 'botconfig', 'embeds', 'analytics'];

      return {
        id: srv.slug,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-3">
            <span className="text-xs font-semibold text-white tracking-tight truncate">
              {srv.name}
            </span>
            <span
              role="switch"
              tabIndex={parentEnabled ? 0 : -1}
              aria-checked={isServerEnabled}
              aria-disabled={!parentEnabled}
              aria-label={`Toggle ${srv.name}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!parentEnabled) return;
                onToggle(['dashboard.servers', serversMapKey, srv.slug, 'enabled'], !isServerEnabled);
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!parentEnabled) return;
                  onToggle(['dashboard.servers', serversMapKey, srv.slug, 'enabled'], !isServerEnabled);
                }
              }}
              className={`relative inline-flex items-center flex-shrink-0 transition-colors duration-200 ease-in-out rounded-full border border-transparent outline-none w-8 h-4 px-0.5 ${
                !parentEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${
                isServerEnabled ? 'bg-brand-red shadow-sm shadow-brand-red/30' : 'bg-white/[0.12]'
              }`}
            >
              <span
                className={`inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out pointer-events-none w-3 h-3 ${
                  isServerEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-2">
            {subKeys.map((featKey) => {
              const featVal = (srv.data[featKey] || {}) as { enabled?: boolean };
              const isFeatEnabled = featVal.enabled !== undefined ? Boolean(featVal.enabled) : false;
              const isSubDisabled = !parentEnabled || !isServerEnabled;
              return (
                <div
                  key={featKey}
                  className={`flex items-center justify-between p-2.5 rounded-apple-md bg-surface-elevated/30 border border-white/[0.04] ${
                    isSubDisabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-300 tracking-tight">
                    {resolveLabel(featKey)}
                  </span>
                  <ToggleSwitch
                    checked={isFeatEnabled}
                    onChange={(c) =>
                      onToggle(['dashboard.servers', serversMapKey, srv.slug, featKey, 'enabled'], c)
                    }
                    disabled={isSubDisabled}
                    size="sm"
                    aria-label={`Toggle ${srv.name} ${resolveLabel(featKey)}`}
                  />
                </div>
              );
            })}
          </div>
        ),
      };
    });

    return (
      <div className={`flex flex-col gap-2 ${!parentEnabled ? 'opacity-50 select-none' : ''}`}>
        <Accordion
          items={serverAccordionItems}
          allowMultiple={true}
          defaultOpenIds={serverEntries.map((s) => s.slug)}
          className="bg-surface-elevated/40 border-white/[0.06] divide-white/[0.04] rounded-apple-lg"
          headerClassName="p-3 text-xs"
          contentClassName="p-2.5 bg-black/20"
        />
      </div>
    );
  }

  // 2. Dashboard : Personnel -> Roles & Permissions toggles
  if (parentKey === 'dashboard.personnel') {
    const rolesObj = (data['dashboard.personnel.roles'] || {}) as { enabled?: boolean };
    const permsObj = (data['dashboard.personnel.perms'] || {}) as { enabled?: boolean };
    const rolesEnabled = rolesObj.enabled !== undefined ? Boolean(rolesObj.enabled) : true;
    const permsEnabled = permsObj.enabled !== undefined ? Boolean(permsObj.enabled) : true;

    return (
      <div className={`flex flex-col gap-2 ${!parentEnabled ? 'opacity-50 select-none' : ''}`}>
        <div className="flex items-center justify-between p-3 rounded-apple-md bg-surface-elevated/30 border border-white/[0.04]">
          <span className="text-xs font-medium text-zinc-300 tracking-tight">Roles</span>
          <ToggleSwitch
            checked={rolesEnabled}
            onChange={(c) => onToggle(['dashboard.personnel', 'dashboard.personnel.roles', 'enabled'], c)}
            disabled={!parentEnabled}
            size="sm"
            aria-label="Toggle Roles"
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-apple-md bg-surface-elevated/30 border border-white/[0.04]">
          <span className="text-xs font-medium text-zinc-300 tracking-tight">Permissions</span>
          <ToggleSwitch
            checked={permsEnabled}
            onChange={(c) => onToggle(['dashboard.personnel', 'dashboard.personnel.perms', 'enabled'], c)}
            disabled={!parentEnabled}
            size="sm"
            aria-label="Toggle Permissions"
          />
        </div>
      </div>
    );
  }

  // 3. Dashboard : Whitelist -> Full access toggle (Visibility toggle removed as redundant with header toggle)
  if (parentKey === 'dashboard.whitelist') {
    const isFullAccess = data.fullAccess !== undefined ? Boolean(data.fullAccess) : false;

    return (
      <div className={`flex flex-col gap-2 ${!parentEnabled ? 'opacity-50 select-none' : ''}`}>
        <div className="flex items-center justify-between p-3 rounded-apple-md bg-surface-elevated/30 border border-white/[0.04]">
          <span className="text-xs font-medium text-zinc-300 tracking-tight">Full access</span>
          <ToggleSwitch
            checked={isFullAccess}
            onChange={(c) => onToggle(['dashboard.whitelist', 'fullAccess'], c)}
            disabled={!parentEnabled}
            size="sm"
            aria-label="Toggle Full access"
          />
        </div>
      </div>
    );
  }

  // 4. Non-expandable modules (Dashboard, Embeds, Botconfig, Account) have no content inside
  return null;
};
