'use client';

import React from 'react';
import { PermsVisualRbacEditor } from './PermsVisualRbacEditor';
import { PermsJsonEditor } from './PermsJsonEditor';
import type { PermsFileNode, PermsEditorTab } from './types';
import type { ServerItem } from '@/lib/model/server';

export interface PermsEditorDeckProps {
  selectedFile: PermsFileNode;
  activeTab: PermsEditorTab;
  jsonText: string;
  onJsonChange: (text: string) => void;
  onTogglePermission: (path: string[], enabled: boolean) => void;
  searchQuery?: string;
  servers?: ServerItem[];
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
