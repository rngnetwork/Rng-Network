'use client';

import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { List, ListItemProps } from '@/components/common/containers/List';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';
import { Card } from '@/components/common/containers/Card';
import type { PermsFolderNode } from './types';

export interface PermsFolderListProps {
  folders: PermsFolderNode[];
  onSelectFolder: (folderId: string) => void;
  className?: string;
}

export const PermsFolderList: React.FC<PermsFolderListProps> = ({
  folders,
  onSelectFolder,
  className = '',
}) => {
  const items: ListItemProps[] = folders.map((folder) => ({
    id: folder.id,
    onClick: () => onSelectFolder(folder.id),
    leading: (
      <div className="w-9 h-9 rounded-apple-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
        <Folder size={18} />
      </div>
    ),
    title: (
      <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
        {folder.name}
      </span>
    ),
    trailing: (
      <div className="flex items-center gap-2.5 shrink-0">
        <Badge
          variant="neutral"
          size="sm"
          className="font-mono text-[10px] hidden sm:inline-flex bg-white/[0.04] border-white/[0.08]"
        >
          {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          rightIcon={<ChevronRight size={14} />}
          className="text-xs text-zinc-300 hover:text-white px-2.5 h-8"
          aria-label={`Open designation folder ${folder.name}`}
        >
          Open
        </Button>
      </div>
    ),
  }));

  const emptyState = (
    <Card className="text-center py-10 px-4 bg-transparent border-none">
      <Folder size={36} className="mx-auto text-zinc-600 mb-2.5" />
      <h3 className="text-sm font-semibold text-white mb-1">
        No Designation Folders Found
      </h3>
      <p className="text-xs text-zinc-400">
        No folders match your current search query.
      </p>
    </Card>
  );

  return (
    <List
      items={items}
      emptyState={emptyState}
      divided={true}
      className={`bg-surface-card border-surface-border rounded-apple-xl shadow-apple-card ${className}`}
    />
  );
};
