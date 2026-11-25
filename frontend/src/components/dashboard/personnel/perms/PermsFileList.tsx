'use client';

import React from 'react';
import { FileCode2, ChevronRight, Folder } from 'lucide-react';
import { List, ListItemProps } from '@/components/common/containers/List';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';
import { Card } from '@/components/common/containers/Card';
import type { PermsFolderNode, PermsFileNode } from '@/lib/model/personnel/perms';

export interface PermsFileListProps {
  folder: PermsFolderNode;
  onSelectFile: (file: PermsFileNode) => void;
  className?: string;
}

export const PermsFileList: React.FC<PermsFileListProps> = ({
  folder,
  onSelectFile,
  className = '',
}) => {
  const items: ListItemProps[] = folder.files.map((file) => ({
    id: file.id,
    onClick: () => onSelectFile(file),
    leading: (
      <div className="w-9 h-9 rounded-apple-md bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red shrink-0">
        <FileCode2 size={18} />
      </div>
    ),
    title: (
      <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-tight truncate">
        {file.fileName}
      </span>
    ),
    trailing: (
      <div className="flex items-center gap-3 shrink-0">
        <Badge
          variant={file.rankWeight >= 8 ? 'brand' : file.rankWeight >= 5 ? 'info' : 'neutral'}
          size="sm"
          className="font-mono text-[10px]"
        >
          {file.rankCode}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          rightIcon={<ChevronRight size={14} />}
          className="text-xs text-zinc-300 hover:text-brand-red px-2.5 h-8"
          aria-label={`Open role file ${file.fileName}`}
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
        No Role Files In &quot;{folder.name}&quot;
      </h3>
      <p className="text-xs text-zinc-400">
        This designation has no registered role specification files.
      </p>
    </Card>
  );

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <List
        items={items}
        emptyState={emptyState}
        divided={true}
        className="bg-surface-card border-surface-border rounded-apple-xl shadow-apple-card"
      />
    </div>
  );
};
