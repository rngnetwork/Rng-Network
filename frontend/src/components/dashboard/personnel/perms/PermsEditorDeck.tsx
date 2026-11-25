'use client';

import React from 'react';
import { PermsVisualRbacEditor } from './PermsVisualRbacEditor';
import { PermsJsonEditor } from './PermsJsonEditor';
import type {
  PermsFileNode,
  PermsEditorTab,
  PermsServerSummary,
} from '@/lib/model/personnel/perms';

export interface PermsEditorDeckProps {
  selectedFile: PermsFileNode;
  activeTab: PermsEditorTab;
  jsonText: string;
  onJsonChange: (text: string) => void;
  onTogglePermission: (path: string[], enabled: boolean) => void;
  searchQuery?: string;
  servers?: PermsServerSummary[];
  labels?: Record<string, string>;
  className?: string;
}

export const PermsEditorDeck: React.FC<PermsEditorDeckProps> = ({
  selectedFile,
  activeTab,
  jsonText,
  onJsonChange,
  onTogglePermission,
  searchQuery = '',
  servers,
  labels,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {activeTab === 'visual' ? (
        <PermsVisualRbacEditor
          schema={selectedFile.schema}
          onTogglePermission={onTogglePermission}
          searchQuery={searchQuery}
          servers={servers}
          labels={labels}
        />
      ) : (
        <PermsJsonEditor
          jsonText={jsonText}
          onChange={onJsonChange}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};
