'use client';

import React, { useMemo, useState } from 'react';
import { Type, Sliders, Search, Layers } from 'lucide-react';
import type { NetworkDefaultPayload } from '@/lib/model/bot-module';
import { Accordion, type AccordionItem } from '@/components/common/navigation/Accordion';
import { TextInput } from '@/components/common/input/TextInput';

export interface NetworkKeyDisplayNamesDeckProps {
  networkKeyDisplayNames: Record<string, string>;
  schema?: NetworkDefaultPayload['schema'];
  searchQuery: string;
  onChangeDisplayName: (keyName: string, newDisplayName: string) => void;
  disabled?: boolean;
}

export const NetworkKeyDisplayNamesDeck: React.FC<NetworkKeyDisplayNamesDeckProps> = ({
  networkKeyDisplayNames,
  schema,
  searchQuery,
  onChangeDisplayName,
  disabled = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const allKeys = useMemo(() => {
    const fromSchema = Object.keys(schema?.networkKeys || {});
    const fromNames = Object.keys(networkKeyDisplayNames || {});
    const combined = Array.from(new Set([...fromSchema, ...fromNames]));
    return combined.sort();
  }, [schema, networkKeyDisplayNames]);

  const categoriesMap = useMemo(() => {
    return schema?.networkKeyCategories || {
      FINANCIAL: 'Financial & Payouts',
      MODERATION: 'Moderation & Security',
      TELEMETRY: 'Roughnecks Telemetry (RT)',
      CITIZENSHIP: 'Citizenship & Community',
      EVENTS: 'Events & Competitions',
      RIVALS: 'Rivals Esports',
      GOVERNANCE: 'Ministries & Governance',
      MISC: 'Miscellaneous',
    };
  }, [schema]);

  const resolveCategory = (key: string): string => {
    return schema?.networkKeys?.[key]?.category || 'MISC';
  };

  const filteredKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allKeys.filter((key) => {
      const category = resolveCategory(key);
      if (selectedCategory !== 'ALL' && category !== selectedCategory) {
        return false;
      }

      if (!query) return true;

      const currentName = networkKeyDisplayNames[key] || '';
      const defaultName = schema?.networkKeys?.[key]?.displayName || schema?.networkKeys?.[key]?.label || key;
      const desc = schema?.networkKeys?.[key]?.description || '';

      return (
        key.toLowerCase().includes(query) ||
        currentName.toLowerCase().includes(query) ||
        defaultName.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query)
      );
    });
  }, [allKeys, schema, networkKeyDisplayNames, searchQuery, selectedCategory]);

  const accordionItems: AccordionItem[] = useMemo(() => {
    return filteredKeys.map((key) => {
      const currentDisplayName = networkKeyDisplayNames[key] ?? '';
      const keyDef = schema?.networkKeys?.[key];
      const defaultName = keyDef?.displayName || keyDef?.label || key;
      const description = keyDef?.description || keyDef?.label;
      const category = resolveCategory(key);
      const categoryLabel = categoriesMap[category] || category;

      return {
        id: key,
        icon: <Type size={18} className="text-brand-red shrink-0" />,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-4">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="text-sm font-bold text-text-primary tracking-tight truncate">
                {currentDisplayName || defaultName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-text-tertiary">
                {key}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-red/10 border border-brand-red/20 text-brand-red hidden sm:inline">
                {categoryLabel}
              </span>
              {description ? (
                <span className="text-xs text-text-tertiary truncate max-w-[260px] hidden md:inline">
                  {description}
                </span>
              ) : null}
            </div>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-3 py-1">
            <div className="max-w-xl">
              <TextInput
                label="Parameter Display Name"
                value={currentDisplayName}
                onChange={(e) => onChangeDisplayName(key, e.target.value)}
                placeholder={`default: ${defaultName}, type: STRING`}
                disabled={disabled}
                helperText={`Human-readable display title for ${key}. Categorized under ${categoryLabel}.`}
              />
            </div>
          </div>
        ),
      };
    });
  }, [filteredKeys, networkKeyDisplayNames, schema, categoriesMap, onChangeDisplayName, disabled]);

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

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-apple-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-brand-red text-white shadow-apple-sm'
              : 'bg-surface-elevated border border-surface-border text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <Layers size={12} />
          <span>All Categories</span>
          <span className="text-[10px] font-mono opacity-80">({allKeys.length})</span>
        </button>

        {Object.entries(categoriesMap).map(([catKey, catLabel]) => {
          const count = allKeys.filter((k) => resolveCategory(k) === catKey).length;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-apple-md text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-brand-red text-white shadow-apple-sm'
                  : 'bg-surface-elevated border border-surface-border text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <span>{catLabel}</span>
              <span className="text-[10px] font-mono opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-text-tertiary">
          Showing {filteredKeys.length} of {allKeys.length} network parameter display names
          {selectedCategory !== 'ALL' && ` in ${categoriesMap[selectedCategory] || selectedCategory}`}
        </span>
      </div>

      {filteredKeys.length === 0 ? (
        <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
          <Search size={28} className="text-text-tertiary" />
          <span className="text-sm font-semibold text-text-primary">No Matching Parameters</span>
          <span className="text-xs text-text-tertiary font-mono">
            No parameter display names match query &quot;{searchQuery}&quot;
          </span>
        </div>
      ) : (
        <Accordion
          key={`${selectedCategory}-${searchQuery ? `net-names-search-${searchQuery}` : 'net-names-default'}`}
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
