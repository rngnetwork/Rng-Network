'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { Button } from '@/components/common/input/Button';

export interface TemplateFilterBarProps {
  searchQuery: string;
  selectedCategory: string;
  onChangeSearch: (query: string) => void;
  onChangeCategory: (category: string) => void;
  onOpenSaveModal: () => void;
}

const CATEGORY_OPTIONS: DropdownOption<string>[] = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Announcements', value: 'ANNOUNCEMENT' },
  { label: 'Rules & Governance', value: 'RULES' },
  { label: 'Support & Tickets', value: 'SUPPORT' },
  { label: 'Operations', value: 'OPERATIONS' },
];

export const TemplateFilterBar: React.FC<TemplateFilterBarProps> = ({
  searchQuery,
  selectedCategory,
  onChangeSearch,
  onChangeCategory,
  onOpenSaveModal,
}) => {
  return (
    <div className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput
          label="Search Saved Templates"
          value={searchQuery}
          onChange={(e) => onChangeSearch(e.target.value)}
          leftIcon={<Search size={15} />}
          placeholder="Filter by template name or tag..."
        />

        <Dropdown
          label="Template Category"
          options={CATEGORY_OPTIONS}
          value={selectedCategory}
          onChange={onChangeCategory}
        />
      </div>

      <Button
        type="button"
        variant="primary"
        size="md"
        leftIcon={<Plus size={16} />}
        onClick={onOpenSaveModal}
      >
        Save Current Layout
      </Button>
    </div>
  );
};
