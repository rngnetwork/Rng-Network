'use client';

import React, { useRef } from 'react';
import { Search, Plus, Upload } from 'lucide-react';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { Button } from '@/components/common/input/Button';

export interface TemplateFilterBarProps {
  searchQuery: string;
  selectedCategory: string;
  categories?: string[];
  onChangeSearch: (query: string) => void;
  onChangeCategory: (category: string) => void;
  onOpenSaveModal: () => void;
  onImportJson?: (data: Record<string, unknown>) => void;
}

export const TemplateFilterBar: React.FC<TemplateFilterBarProps> = ({
  searchQuery,
  selectedCategory,
  categories = [],
  onChangeSearch,
  onChangeCategory,
  onOpenSaveModal,
  onImportJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions: DropdownOption<string>[] = React.useMemo(() => {
    const list: DropdownOption<string>[] = [
      { label: 'All Categories', value: 'ALL' },
    ];
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        if (cat) {
          list.push({ label: cat, value: cat });
        }
      });
    }
    return list;
  }, [categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          onImportJson?.(parsed as Record<string, unknown>);
        }
      } catch {
        // Handled by parent or toast
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

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
          options={categoryOptions}
          value={selectedCategory}
          onChange={onChangeCategory}
        />
      </div>

      <div className="flex items-center gap-2">
        {onImportJson && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<Upload size={15} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </Button>
        )}
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
    </div>
  );
};
