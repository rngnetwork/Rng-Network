'use client';

import React, { useMemo } from 'react';
import { Type, Bot, Search } from 'lucide-react';
import type { NetworkDefaultPayload } from '@/lib/model/bot-module';
import { Accordion, type AccordionItem } from '@/components/common/navigation/Accordion';
import { TextInput } from '@/components/common/input/TextInput';

export interface ModuleDisplayNamesDeckProps {
  moduleDisplayNames: Record<string, string>;
  schema?: NetworkDefaultPayload['schema'];
  searchQuery: string;
  onChangeDisplayName: (modKey: string, newDisplayName: string) => void;
  disabled?: boolean;
}

export const ModuleDisplayNamesDeck: React.FC<ModuleDisplayNamesDeckProps> = ({
  moduleDisplayNames,
  schema,
  searchQuery,
  onChangeDisplayName,
  disabled = false,
}) => {
  const moduleKeys = useMemo(() => {
    const fromSchema = Object.keys(schema?.modules || {});
    const fromNames = Object.keys(moduleDisplayNames || {});
    const combined = Array.from(new Set([...fromSchema, ...fromNames]));
    return combined.sort();
  }, [schema, moduleDisplayNames]);

  const filteredKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return moduleKeys;

    return moduleKeys.filter((key) => {
      const currentName = moduleDisplayNames[key] || '';
      return key.toLowerCase().includes(query) || currentName.toLowerCase().includes(query);
    });
  }, [moduleKeys, moduleDisplayNames, searchQuery]);

  const accordionItems: AccordionItem[] = useMemo(() => {
    return filteredKeys.map((modKey) => {
      const currentDisplayName = moduleDisplayNames[modKey] ?? '';
      const defaultName = schema?.moduleDisplayNames?.[modKey] || modKey;
      const modFields = schema?.modules?.[modKey];
      const fieldsCount =
        modFields && typeof modFields === 'object'
          ? Object.keys(modFields).filter((k) => k !== 'displayName').length
          : 0;

      return {
        id: modKey,
        icon: <Type size={18} className="text-brand-red shrink-0" />,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm font-bold text-text-primary tracking-tight truncate">
                {currentDisplayName || defaultName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-text-tertiary">
                {modKey}
              </span>
            </div>
            <span className="text-[11px] font-mono text-text-tertiary hidden sm:inline">
              {fieldsCount} field{fieldsCount === 1 ? '' : 's'}
            </span>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-3 py-1">
            <div className="max-w-xl">
              <TextInput
                label="Module Display Name"
                value={currentDisplayName}
                onChange={(e) => onChangeDisplayName(modKey, e.target.value)}
                placeholder={`default: ${defaultName}, type: STRING`}
                disabled={disabled}
                helperText="Human-readable title displayed across navigation decks, embeds, and server module lists."
              />
            </div>
          </div>
        ),
      };
    });
  }, [filteredKeys, moduleDisplayNames, schema, onChangeDisplayName, disabled]);

  if (moduleKeys.length === 0) {
    return (
      <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
        <Bot size={28} className="text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">No Modules Found</span>
        <span className="text-xs text-text-tertiary font-mono">
          No bot modules delivered by upstream API.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-text-tertiary">
          Showing {filteredKeys.length} of {moduleKeys.length} module display names
        </span>
      </div>

      {filteredKeys.length === 0 ? (
        <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
          <Search size={28} className="text-text-tertiary" />
          <span className="text-sm font-semibold text-text-primary">No Matching Modules</span>
          <span className="text-xs text-text-tertiary font-mono">
            No module display names match query &quot;{searchQuery}&quot;
          </span>
        </div>
      ) : (
        <Accordion
          key={searchQuery ? `mod-names-search-${searchQuery}` : 'mod-names-default'}
          items={accordionItems}
          allowMultiple={true}
          showCollapseAll={true}
          defaultOpenIds={filteredKeys}
          className="rounded-apple-xl border-surface-border bg-surface-elevated shadow-apple-card overflow-hidden"
        />
      )}
    </div>
  );
};
