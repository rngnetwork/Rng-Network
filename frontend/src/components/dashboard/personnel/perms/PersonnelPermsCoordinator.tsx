'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { getStoredAccessToken } from '@/lib/api/core/client';
import { fetchRoleHierarchyMatrix } from '@/lib/api/dashboard/personnel';
import { fetchServers } from '@/lib/api/dashboard/servers';
import type { ServerItem } from '@/lib/model/server';
import { buildDirectoryTree, updatePermissionAtPath } from './permsSchemaHelper';
import { PermsBreadcrumbBar } from './PermsBreadcrumbBar';
import { PermsFolderList } from './PermsFolderList';
import { PermsFileList } from './PermsFileList';
import { PermsEditorDeck } from './PermsEditorDeck';
import type {
  PermsFolderNode,
  PermsFileNode,
  PermsRoleSchema,
  PermsEditorTab,
  ExplorerView,
} from './types';

export const PersonnelPermsCoordinator: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<PermsFolderNode[]>([]);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [view, setView] = useState<ExplorerView>({ type: 'root' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<PermsEditorTab>('visual');
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState<string>('');
  const [baselineJson, setBaselineJson] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const token = getStoredAccessToken() || undefined;
        const [res, sRes] = await Promise.all([
          fetchRoleHierarchyMatrix(token),
          fetchServers(token).catch(() => null),
        ]);
        if (isMounted) {
          if (res?.success && res.data) {
            setFolders(buildDirectoryTree(res.data.ranks || [], res.data.designations || [], res.data.cells || {}));
          }
          if (sRes?.success && sRes.data) {
            setServers(sRes.data);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast({
            type: 'error',
            title: 'Failed to Synchronize Hierarchy Directory',
            description: err instanceof Error ? err.message : 'Error loading roles.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [toast]);

  const activeFolder = useMemo(() => {
    if (view.type === 'folder' || view.type === 'file') {
      return folders.find((f) => f.id === view.folderId) || null;
    }
    return null;
  }, [folders, view]);

  const activeFile = useMemo(() => {
    if (view.type === 'file' && activeFolder) {
      return activeFolder.files.find((f) => f.id === view.fileId) || null;
    }
    return null;
  }, [activeFolder, view]);

  useEffect(() => {
    if (activeFile) {
      const text = JSON.stringify(activeFile.schema, null, 2);
      setJsonText(text);
      setBaselineJson(text);
    }
  }, [activeFile?.id]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const fileMatches = (f: PermsFileNode) =>
    !normalizedQuery ||
    f.name.toLowerCase().includes(normalizedQuery) ||
    f.fileName.toLowerCase().includes(normalizedQuery) ||
    f.rankCode.toLowerCase().includes(normalizedQuery);

  const filteredFolders = useMemo(() => {
    if (!normalizedQuery) return folders;
    return folders
      .map((f) => {
        if (f.name.toLowerCase().includes(normalizedQuery)) return f;
        const matching = f.files.filter(fileMatches);
        return matching.length > 0 ? { ...f, files: matching } : null;
      })
      .filter((f): f is PermsFolderNode => f !== null);
  }, [folders, normalizedQuery]);

  const filteredActiveFolder = useMemo(() => {
    if (!activeFolder || !normalizedQuery) return activeFolder;
    return { ...activeFolder, files: activeFolder.files.filter(fileMatches) };
  }, [activeFolder, normalizedQuery]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleUpdateFileSchema = (fileId: string, updatedSchema: PermsRoleSchema) => {
    setFolders((prev) =>
      prev.map((f) => ({
        ...f,
        files: f.files.map((file) => (file.id === fileId ? { ...file, schema: updatedSchema } : file)),
      }))
    );
  };

  const handleTogglePermission = (path: string[], enabled: boolean) => {
    if (!activeFile) return;
    const nextSchema = updatePermissionAtPath(activeFile.schema, path, enabled);
    setJsonText(JSON.stringify(nextSchema, null, 2));
    handleUpdateFileSchema(activeFile.id, nextSchema);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    if (!activeFile) return;
    try {
      const parsed = JSON.parse(text) as PermsRoleSchema;
      if (parsed.permissions && parsed.metadata) handleUpdateFileSchema(activeFile.id, parsed);
    } catch {}
  };

  const isDirty = view.type === 'file' && Boolean(activeFile) && jsonText !== baselineJson;

  const handleReset = useCallback(() => {
    if (!activeFile) return;
    setJsonText(baselineJson);
    try {
      const parsed = JSON.parse(baselineJson) as PermsRoleSchema;
      handleUpdateFileSchema(activeFile.id, parsed);
    } catch {}
  }, [activeFile, baselineJson]);

  const handleSave = useCallback(async () => {
    if (!activeFile) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setBaselineJson(jsonText);
    setIsSaving(false);
    toast({
      type: 'info',
      title: 'Policy Changes Staged',
      description: 'Changes staged locally. Remote backend endpoint is pending implementation.',
    });
  }, [activeFile, jsonText, toast]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-3">
        <RngLoadingSpinner size="lg" label="Synchronizing Role Hierarchy..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full pb-32">
      <PermsBreadcrumbBar
        view={view}
        activeFolder={activeFolder}
        activeFile={activeFile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateRoot={() => { setSearchQuery(''); setView({ type: 'root' }); }}
        onNavigateFolder={(folderId) => { setSearchQuery(''); setView({ type: 'folder', folderId }); }}
        onNavigateBack={() => {
          setSearchQuery('');
          if (view.type === 'file') setView({ type: 'folder', folderId: view.folderId });
          else if (view.type === 'folder') setView({ type: 'root' });
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCopyJson={handleCopyJson}
        copied={copied}
      />

      {view.type === 'root' && (
        <PermsFolderList
          folders={filteredFolders}
          onSelectFolder={(folderId) => { setSearchQuery(''); setView({ type: 'folder', folderId }); }}
        />
      )}

      {view.type === 'folder' && filteredActiveFolder && (
        <PermsFileList
          folder={filteredActiveFolder}
          onSelectFile={(file) => { setSearchQuery(''); setView({ type: 'file', folderId: file.designationId, fileId: file.id }); }}
        />
      )}

      {view.type === 'file' && activeFile && (
        <PermsEditorDeck
          selectedFile={activeFile}
          activeTab={activeTab}
          jsonText={jsonText}
          onJsonChange={handleJsonChange}
          onTogglePermission={handleTogglePermission}
          searchQuery={searchQuery}
          servers={servers}
        />
      )}

      <GlobalUnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        message="Careful — you have unsaved policy edits!"
      />
    </div>
  );
};
