'use client';

import React from 'react';
import { ArrowLeft, Search, Sliders, Code2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/common/input/Button';
import { TextInput } from '@/components/common/input/TextInput';
import { Badge } from '@/components/common/feedback/Badge';
import { Breadcrumbs, BreadcrumbItem } from '@/components/common/navigation/Breadcrumbs';
import type {
  ExplorerView,
  PermsFolderNode,
  PermsFileNode,
  PermsEditorTab,
} from '@/lib/model/personnel/perms';

export interface PermsBreadcrumbBarProps {
  view: ExplorerView;
  activeFolder: PermsFolderNode | null;
  activeFile: PermsFileNode | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateRoot: () => void;
  onNavigateFolder: (folderId: string) => void;
  onNavigateBack: () => void;
  activeTab?: PermsEditorTab;
  onTabChange?: (tab: PermsEditorTab) => void;
  onCopyJson?: () => void;
  copied?: boolean;
  className?: string;
}

export const PermsBreadcrumbBar: React.FC<PermsBreadcrumbBarProps> = ({
  view,
  activeFolder,
  activeFile,
  searchQuery,
  onSearchChange,
  onNavigateRoot,
  onNavigateFolder,
  onNavigateBack,
  activeTab = 'visual',
  onTabChange,
  onCopyJson,
  copied = false,
  className = '',
}) => {
  const isAtRoot = view.type === 'root';
  const isFileView = view.type === 'file';

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Hierarchy',
      onClick: onNavigateRoot,
    },
  ];

  if (activeFolder) {
    breadcrumbItems.push({
      label: activeFolder.name,
      onClick: () => onNavigateFolder(activeFolder.id),
    });
  }

  if (activeFile) {
    breadcrumbItems.push({
      label: (
        <span className="flex items-center gap-1.5 font-mono">
          <span>{activeFile.fileName}</span>
          <Badge
            variant={activeFile.rankWeight >= 8 ? 'brand' : 'info'}
            size="sm"
            className="text-[10px] py-0 px-1.5 font-mono"
          >
            {activeFile.rankCode}
          </Badge>
        </span>
      ),
    });
  }

  return (
    <div
      className={`p-3 rounded-apple-xl bg-surface-card border border-surface-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      {/* Navigation & Common Breadcrumbs */}
      <div className="flex items-center gap-3 overflow-x-auto py-0.5 scrollbar-none">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onNavigateBack}
          disabled={isAtRoot}
          leftIcon={<ArrowLeft size={14} />}
          className="h-8 px-2.5 shrink-0"
          aria-label="Navigate to previous directory level"
        >
          Back
        </Button>

        <Breadcrumbs items={breadcrumbItems} className="shrink-0" />
      </div>

      {/* Right Side: Mode Switcher & Copy when file is open, Search Bar when directory is open */}
      {isFileView ? (
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Card enclosed mode switching buttons */}
          <div
            role="radiogroup"
            aria-label="Editor View Mode"
            className="p-0.5 rounded-apple-md bg-surface-elevated/80 backdrop-blur-md border border-surface-border flex items-center gap-0.5 shrink-0 shadow-sm"
          >
            <button
              type="button"
              role="radio"
              aria-checked={activeTab === 'visual'}
              onClick={() => onTabChange?.('visual')}
              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] aspect-square p-0 flex items-center justify-center rounded-apple-sm transition-all duration-150 select-none outline-none focus-visible:ring-1 focus-visible:ring-brand-red ${
                activeTab === 'visual'
                  ? 'bg-brand-red/15 backdrop-blur-md text-white border border-brand-red/30 shadow-sm shadow-brand-red/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
              }`}
              aria-label="Visual RBAC"
              title="Visual RBAC"
            >
              <Sliders size={13} className={activeTab === 'visual' ? 'text-white' : 'text-text-secondary'} />
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={activeTab === 'json'}
              onClick={() => onTabChange?.('json')}
              className={`w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] aspect-square p-0 flex items-center justify-center rounded-apple-sm transition-all duration-150 select-none outline-none focus-visible:ring-1 focus-visible:ring-brand-red ${
                activeTab === 'json'
                  ? 'bg-brand-red/15 backdrop-blur-md text-white border border-brand-red/30 shadow-sm shadow-brand-red/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-transparent'
              }`}
              aria-label="JSON Schema"
              title="JSON Schema"
            >
              <Code2 size={13} className={activeTab === 'json' ? 'text-white' : 'text-text-secondary'} />
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Nameless Copy JSON Button (Icon Only) */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCopyJson}
            className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square p-0 flex items-center justify-center shrink-0 rounded-apple-md bg-surface-elevated/80 backdrop-blur-md border border-surface-border hover:bg-white/[0.08]"
            aria-label="Copy JSON"
            title={copied ? 'Copied to clipboard!' : 'Copy JSON'}
          >
            {copied ? (
              <Check size={14} className="text-accent-success" />
            ) : (
              <Copy size={14} className="text-text-secondary hover:text-text-primary" />
            )}
          </Button>
        </div>
      ) : (
        <div className="w-full md:w-64 shrink-0">
          <TextInput
            placeholder="Search directory..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            leftIcon={<Search size={14} />}
            className="text-xs"
          />
        </div>
      )}
    </div>
  );
};
