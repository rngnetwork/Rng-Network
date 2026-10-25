'use client';

import React, { useMemo } from 'react';
import { Sliders, Search } from 'lucide-react';
import type { ServerItem } from '@/lib/model/server';
import type { NetworkDefaultPayload } from '@/lib/model/bot-module';
import { Accordion, type AccordionItem } from '@/components/common/navigation/Accordion';
import { Badge } from '@/components/common/feedback/Badge';
import { NetworkKeyConfigCard } from './NetworkKeyConfigCard';

export interface NetworkParametersDeckProps {
  network: Record<string, unknown>;
  schema?: NetworkDefaultPayload['schema'];
  searchQuery: string;
  onFieldChange: (key: string, value: unknown) => void;
  servers: ServerItem[];
  disabled?: boolean;
}

export const NetworkParametersDeck: React.FC<NetworkParametersDeckProps> = ({
  network,
  schema,
  searchQuery,
  onFieldChange,
  servers,
  disabled = false,
}) => {
  const allKeys = useMemo(() => {
    const keysFromSchema = Object.keys(schema?.networkKeys || {});
    const keysFromNetwork = Object.keys(network || {});
    const combined = Array.from(new Set([...keysFromSchema, ...keysFromNetwork]));
    return combined.sort();
  }, [schema, network]);

  const filteredKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allKeys;

    return allKeys.filter((key) => {
      const displayName =
        schema?.networkKeyDisplayNames?.[key] ||
        schema?.networkKeys?.[key]?.displayName ||
        key;
      const desc = schema?.networkKeys?.[key]?.description || '';
      const rawVal = network[key];
      const valLabel =
        typeof rawVal === 'object' && rawVal !== null && 'label' in rawVal
          ? String((rawVal as { label?: string }).label || '')
          : '';

      return (
        key.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        valLabel.toLowerCase().includes(query)
      );
    });
  }, [allKeys, schema, network, searchQuery]);

  const accordionItems: AccordionItem[] = useMemo(() => {
    return filteredKeys.map((key) => {
      const rawVal = network[key];
      const keyDef = schema?.networkKeys?.[key];
      const displayName =
        schema?.networkKeyDisplayNames?.[key] ||
        keyDef?.displayName ||
        key;

      const description =
        typeof rawVal === 'object' && rawVal !== null && 'label' in rawVal && typeof (rawVal as { label?: unknown }).label === 'string'
          ? (rawVal as { label: string }).label
          : keyDef?.description;

      const rawObj =
        typeof rawVal === 'object' && rawVal !== null && !Array.isArray(rawVal)
          ? (rawVal as Record<string, unknown>)
          : null;
      const isUniform = rawObj ? rawObj.uniform !== false : true;
      const serversCount = rawObj && typeof rawObj.servers === 'number' ? rawObj.servers : 0;

      return {
        id: key,
        icon: <Sliders size={18} className="text-brand-red shrink-0" />,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-4">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="text-sm font-bold text-text-primary tracking-tight truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-text-tertiary">
                {key}
              </span>
              {description ? (
                <span className="text-xs text-text-tertiary truncate max-w-[280px] hidden md:inline">
                  {description}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isUniform ? (
                <Badge variant="brand" size="sm">
                  Uniform
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Overridden ({serversCount})
                </Badge>
              )}
            </div>
          </div>
        ),
        content: (
          <div className="pt-1">
            <NetworkKeyConfigCard
              keyName={key}
              displayName={displayName}
              description={description}
              rawValue={rawVal}
              onChange={(updatedVal) => onFieldChange(key, updatedVal)}
              servers={servers}
              disabled={disabled}
              hideHeader={true}
            />
          </div>
        ),
      };
    });
  }, [filteredKeys, network, schema, onFieldChange, servers, disabled]);

  if (allKeys.length === 0) {
    return (
      <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
        <Sliders size={28} className="text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">No Network Parameters</span>
        <span className="text-xs text-text-tertiary font-mono">
          No network-wide configuration keys delivered by upstream API.
        </span>
      </div>
    );
  }

  if (filteredKeys.length === 0) {
    return (
      <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
        <Search size={28} className="text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">No Matching Parameters</span>
        <span className="text-xs text-text-tertiary font-mono">
          No network parameters match query &quot;{searchQuery}&quot;
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-text-tertiary">
          Showing {filteredKeys.length} of {allKeys.length} network parameters
        </span>
      </div>

      <Accordion
        key={searchQuery ? `network-search-${searchQuery}` : 'network-default'}
        items={accordionItems}
        allowMultiple={true}
        defaultOpenIds={filteredKeys}
        className="rounded-apple-xl border-surface-border bg-surface-elevated shadow-apple-card overflow-hidden"
      />
    </div>
  );
};
