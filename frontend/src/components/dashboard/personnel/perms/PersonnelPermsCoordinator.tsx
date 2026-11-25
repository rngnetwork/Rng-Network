'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { getStoredAccessToken } from '@/lib/api/core/client';
import {
  fetchPermsExplorer,
  updateRolePermissions,
} from '@/lib/api/dashboard/personnel/perms';
import { PermsBreadcrumbBar } from './PermsBreadcrumbBar';
import { PermsFolderList } from './PermsFolderList';
import { PermsFileList } from './PermsFileList';
import { PermsEditorDeck } from './PermsEditorDeck';
import type {
  PermsFolderNode,
  PermsFileNode,
  PermsRoleSchema,
  PermsEditorTab,
  PermsObject,
  PermsServerSummary,
  ExplorerView,
} from '@/lib/model/personnel/perms';

function setNestedBoolean(target: PermsObject, path: string[], val: boolean): PermsObject {
  if (path.length === 0) return target;
  const [head, ...tail] = path;
  if (tail.length === 0) {
    return { ...target, [head]: val };
  }
  const child = (target[head] && typeof target[head] === 'object' ? target[head] : {}) as PermsObject;
  return {
    ...target,
    [head]: setNestedBoolean(child, tail, val),
  };
}

export const PersonnelPermsCoordinator: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<PermsFolderNode[]>([]);
  const [servers, setServers] = useState<PermsServerSummary[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
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
        const res = await fetchPermsExplorer(token);
        if (isMounted && res?.success && res.data) {
          setFolders(res.data.folders || []);
          setServers(res.data.servers || []);
          setLabels(res.data.labels || {});
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast({
            type: 'error',
            title: 'Failed to Synchronize Permissions Directory',
            description: err instanceof Error ? err.message : 'Error loading role permissions.',
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
    const nextSchema: PermsRoleSchema = {
      ...activeFile.schema,
      permissions: setNestedBoolean(activeFile.schema.permissions, path, enabled),
    };
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
    try {
      const token = getStoredAccessToken() || undefined;
      const res = await updateRolePermissions(
        activeFile.id,
        activeFile.schema.permissions,
        activeFile.schema.metadata.version,
        token
      );
      if (res?.success && res.data) {
        const syncedSchema: PermsRoleSchema = {
          ...activeFile.schema,
          metadata: {
            ...activeFile.schema.metadata,
            version: res.data.version,
            last_modified_at: res.data.updatedAt ?? activeFile.schema.metadata.last_modified_at,
            last_modified_by: res.data.updatedBy ?? activeFile.schema.metadata.last_modified_by,
          },
          permissions: res.data.permissions || activeFile.schema.permissions,
        };
        const syncedText = JSON.stringify(syncedSchema, null, 2);
        handleUpdateFileSchema(activeFile.id, syncedSchema);
        setJsonText(syncedText);
        setBaselineJson(syncedText);
        if (res.data.labels) {
          setLabels((prev) => ({ ...prev, ...res.data.labels }));
        }
        window.dispatchEvent(new CustomEvent('rng:permissions-updated'));
        toast({
          type: 'success',
          title: 'Permissions Saved',
          description: `Updated policy for ${activeFile.name} (v${res.data.version}).`,
        });
      }
    } catch (err: unknown) {
      toast({
        type: 'error',
        title: 'Failed to Save Permissions',
        description: err instanceof Error ? err.message : 'Unable to persist role permissions.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, toast]);

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
          labels={labels}
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
