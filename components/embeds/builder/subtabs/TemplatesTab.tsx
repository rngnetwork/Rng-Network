"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TemplateItem, Type17Container, BackendEmbedTemplate } from '../../types';
import { api } from '@/lib/api';
import { buildDiscordV2MessagePayload, parseDiscordPayloadToState } from '../../validation';
import {
  Layers,
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  FileDown,
  Upload,
  AlertCircle
} from 'lucide-react';

export interface TemplatesTabProps {
  currentBuilderState?: {
    message: { content: string };
    type17Containers: Type17Container[];
  };
  onLoadTemplate: (state: { message: { content: string }; type17Containers: Type17Container[] }) => void;
  allowCreate?: boolean;
  allowSearch?: boolean;
  serverId?: string;
}

const sanitizeBadge = (val: string): string => {
  if (!val) return '';
  const firstWord = val.trim().split(/\s+/)[0] || '';
  return firstWord.toLowerCase().replace(/[^a-z0-9_-]/g, '');
};

export function TemplatesTab({
  currentBuilderState,
  onLoadTemplate,
  allowCreate = true,
  allowSearch = true,
  serverId = 'default'
}: TemplatesTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [userTemplates, setUserTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBadge, setNewTemplateBadge] = useState('custom');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isPublicTemplate, setIsPublicTemplate] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit template state
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateBadge, setEditTemplateBadge] = useState('custom');
  const [editTemplateDesc, setEditTemplateDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editOverwriteCanvas, setEditOverwriteCanvas] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyTemplateId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load templates strictly from MongoDB API
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const effectiveServerId = serverId && serverId !== 'default' ? serverId : undefined;
      const [serverRes, publicRes] = await Promise.all([
        effectiveServerId ? api.fetchTemplates({ serverId: effectiveServerId, size: 100 }) : api.fetchTemplates({ size: 100 }),
        api.fetchTemplates({ size: 100 })
      ]);

      const extractItems = (response: any): BackendEmbedTemplate[] => {
        if (!response?.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.data.content)) return response.data.content;
        return [];
      };

      const serverItems = extractItems(serverRes);
      const publicItems = extractItems(publicRes);

      // Deduplicate templates strictly from MongoDB by both templateId and mongo id
      const seenKeys = new Set<string>();
      const uniqueTemplates: BackendEmbedTemplate[] = [];

      [...serverItems, ...publicItems].forEach((bt) => {
        const tId = bt.templateId ? String(bt.templateId).trim() : undefined;
        const mId = bt.id ? String(bt.id).trim() : undefined;
        const key = tId || mId;
        if (!key) return;

        if (seenKeys.has(key) || (tId && seenKeys.has(tId)) || (mId && seenKeys.has(mId))) {
          return;
        }

        if (tId) seenKeys.add(tId);
        if (mId) seenKeys.add(mId);
        uniqueTemplates.push(bt);
      });

      const rawItems = uniqueTemplates;

      if (rawItems.length > 0) {
        const mapped: TemplateItem[] = rawItems.map((bt: BackendEmbedTemplate) => {
          const p = (bt.payload || bt.payloadJson || {}) as Record<string, unknown>;
          let containers: Type17Container[] = [];
          let content = '';

          if (Array.isArray(p.containers)) {
            containers = p.containers as Type17Container[];
            content = String(p.content || p.builderContent || '');
          } else if (Array.isArray(p.components)) {
            try {
              const parsed = parseDiscordPayloadToState(p);
              containers = parsed.containers || [];
              content = parsed.messageContent || '';
            } catch {
              containers = [];
            }
          }

          return {
            id: bt.templateId || bt.id,
            templateId: bt.templateId || bt.id,
            name: bt.name,
            badge: sanitizeBadge(bt.category || '') || 'custom',
            description: bt.description || 'Cloud synchronized template.',
            createdAt: bt.createdAt ? new Date(bt.createdAt).toLocaleDateString() : undefined,
            isPublic: bt.isPublic ?? bt.public ?? false,
            serverId: bt.serverId,
            state: {
              message: { content },
              type17Containers: containers
            }
          };
        });
        setUserTemplates(mapped);
      } else {
        setUserTemplates([]);
      }
    } catch {
      setUserTemplates([]);
    } finally {
      // Clean up any stale legacy localStorage template keys from browser
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('rng_discord_user_templates');
          localStorage.removeItem('rng_embed_templates');
        } catch {}
      }
      setIsLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSaveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      showToast('Please enter a template name.', 'error');
      return;
    }

    const templateState = currentBuilderState || {
      message: { content: '' },
      type17Containers: []
    };

    if ((!templateState.type17Containers || templateState.type17Containers.length === 0) && !templateState.message?.content?.trim()) {
      showToast('Please add at least one container or text before saving template.', 'error');
      return;
    }

    const wire = buildDiscordV2MessagePayload(templateState.type17Containers || [], templateState.message?.content || '');
    const effectiveServerId = serverId && serverId !== 'default' ? serverId : undefined;
    const payloadToSend = {
      flags: 32768,
      components: wire.components,
      containers: templateState.type17Containers || [],
      content: templateState.message?.content || ''
    };

    const finalBadge = sanitizeBadge(newTemplateBadge) || 'custom';
    let assignedId = `tmpl_user_${Date.now()}`;
    try {
      const saveRes = await api.saveTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Custom template',
        category: finalBadge,
        serverId: effectiveServerId,
        isPublic: isPublicTemplate,
        payload: payloadToSend
      });
      if (saveRes?.data) {
        if (saveRes.data.templateId) assignedId = String(saveRes.data.templateId);
        else if (saveRes.data.id) assignedId = String(saveRes.data.id);
      }
      showToast('Template saved successfully to MongoDB!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save template to MongoDB.';
      showToast(msg, 'error');
      return;
    }

    const newTmpl: TemplateItem = {
      id: assignedId,
      templateId: assignedId,
      name: newTemplateName.trim(),
      badge: finalBadge,
      description: newTemplateDesc.trim() || 'Custom user created template.',
      createdAt: new Date().toLocaleDateString(),
      state: JSON.parse(JSON.stringify(templateState))
    };

    setUserTemplates((prev) => [newTmpl, ...prev]);

    setIsCreateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateBadge('custom');
    setIsPublicTemplate(false);
  };

  const handleDeleteUserTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    try {
      await api.deleteTemplate(id);
      showToast('Template deleted successfully from MongoDB.');
      setUserTemplates((prev) => prev.filter((t) => t.id !== id && t.templateId !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete template from MongoDB.';
      showToast(msg, 'error');
    }
  };

  const handleOpenEditModal = (tmpl: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(tmpl);
    setEditTemplateName(tmpl.name);
    setEditTemplateDesc(tmpl.description || '');
    setEditTemplateBadge(sanitizeBadge(tmpl.badge) || 'custom');
    setEditIsPublic(Boolean(tmpl.isPublic));
    setEditOverwriteCanvas(false);
  };

  const handleSaveEditTemplate = async () => {
    if (!editingTemplate || !editTemplateName.trim()) {
      showToast('Please enter a template name.', 'error');
      return;
    }
    setIsUpdating(true);

    const targetState = editOverwriteCanvas && currentBuilderState
      ? currentBuilderState
      : editingTemplate.state;

    const wire = buildDiscordV2MessagePayload(targetState.type17Containers || [], targetState.message?.content || '');
    const payloadState = {
      flags: 32768,
      components: wire.components,
      containers: targetState.type17Containers || [],
      content: targetState.message?.content || ''
    };

    const finalBadge = sanitizeBadge(editTemplateBadge) || 'custom';
    try {
      if (editingTemplate.id.startsWith('tmpl_user_')) {
        const createRes = await api.saveTemplate({
          name: editTemplateName.trim(),
          description: editTemplateDesc.trim() || 'Custom template',
          category: finalBadge,
          serverId: editingTemplate.serverId || (serverId && serverId !== 'default' ? serverId : undefined),
          isPublic: editIsPublic,
          payload: payloadState
        });
        if (createRes?.data) {
          if (createRes.data.templateId) editingTemplate.id = String(createRes.data.templateId);
          else if (createRes.data.id) editingTemplate.id = String(createRes.data.id);
        }
      } else {
        await api.saveTemplate({
          id: editingTemplate.id,
          name: editTemplateName.trim(),
          description: editTemplateDesc.trim() || 'Custom template',
          category: finalBadge,
          serverId: editingTemplate.serverId || (serverId && serverId !== 'default' ? serverId : undefined),
          isPublic: editIsPublic,
          payload: payloadState
        });
      }
      showToast('Template updated successfully!');
    } catch {
      showToast('Updated in local browser storage.', 'success');
    } finally {
      setIsUpdating(false);
    }

    const updatedItem: TemplateItem = {
      ...editingTemplate,
      name: editTemplateName.trim(),
      badge: finalBadge,
      description: editTemplateDesc.trim(),
      isPublic: editIsPublic,
      state: JSON.parse(JSON.stringify(targetState))
    };

    const updated = userTemplates.map((t) => t.id === editingTemplate.id ? updatedItem : t);
    setUserTemplates(updated);
    setEditingTemplate(null);
  };

  // Export a template as JSON file
  const handleExportTemplate = (tmpl: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tmpl, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_template.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported "${tmpl.name}" as JSON!`);
  };

  // Import a template from JSON file
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed || typeof parsed !== 'object' || !parsed.name || !parsed.state) {
          showToast('Invalid template JSON file format.', 'error');
          return;
        }

        const importedTmpl: TemplateItem = {
          id: `tmpl_user_${Date.now()}`,
          name: String(parsed.name).trim() || 'Imported Template',
          badge: sanitizeBadge(String(parsed.badge || 'custom')) || 'custom',
          description: String(parsed.description || 'Imported from JSON file.'),
          createdAt: new Date().toLocaleDateString(),
          state: {
            message: { content: parsed.state?.message?.content || '' },
            type17Containers: Array.isArray(parsed.state?.type17Containers) ? parsed.state.type17Containers : []
          }
        };

        const updated = [importedTmpl, ...userTemplates];
        setUserTemplates(updated);
        showToast(`Template "${importedTmpl.name}" imported successfully!`);
      } catch (err) {
        showToast(`Import error: ${err instanceof Error ? err.message : 'Invalid JSON'}`, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const allTemplates = useMemo(() => {
    return [...userTemplates];
  }, [userTemplates]);

  const categories = useMemo(() => {
    return Array.from(new Set(userTemplates.map((t) => sanitizeBadge(t.badge) || 'custom')));
  }, [userTemplates]);

  const filtered = useMemo(() => {
    let list = userTemplates;
    if (categoryFilter !== 'ALL') {
      list = list.filter((t) => (sanitizeBadge(t.badge) || 'custom') === categoryFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.badge.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [userTemplates, categoryFilter, search]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0c0e] text-white overflow-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-2xl ${
            toastMessage.type === 'success'
              ? 'bg-[#064e3b] border-[#059669] text-white'
              : 'bg-[#7f1d1d] border-[#dc2626] text-white'
          }`}
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Top Bar - Matching ActionTemplatesTab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/10 bg-white/[0.01]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-red-500">
                <Layers className="w-5 h-5" />
              </span>
              Discord Templates Gallery
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
              Components V2
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Pre-built and custom Type 17 &amp; Components V2 presets. Instant 1-click loading and cloud synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Import JSON Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import Template from JSON File"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-black/40 hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import JSON</span>
          </button>

          {/* Save Current as Template Button */}
          {allowCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Current as Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Controls & Filter Bar - Matching ActionTemplatesTab */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          {allowSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates by name, badge, description..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Category & Scope Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                  : 'bg-black/30 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              All Types
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                    : 'bg-black/30 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadTemplates}
              title="Refresh templates"
              className="p-2 rounded-lg bg-black/30 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-xs gap-2">
            <div className="w-5 h-5 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
            <span>Loading templates...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl bg-white/[0.01] border border-white/5 p-8">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 mb-3">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No Templates Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-4">
              {search || categoryFilter !== 'ALL'
                ? 'No templates match your current search and filter criteria.'
                : 'Get started by saving your current canvas as a reusable Discord Components V2 template.'}
            </p>
            {allowCreate && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as Template</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((tmpl) => {
              const isUserCreated = userTemplates.some((d) => d.id === tmpl.id);
              return (
                <div
                  key={tmpl.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-[#141519] border border-white/10 hover:border-red-500/40 hover:shadow-xl hover:shadow-black/60 transition-all duration-200 overflow-hidden"
                >
                  {/* 1. Wireframe Header: $templateName$ */}
                  <div className="px-5 py-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {tmpl.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/10 text-zinc-400 shrink-0">
                      {tmpl.state.type17Containers?.length || 0} Container{(tmpl.state.type17Containers?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* 2. Wireframe Middle Section: ID chip, Type badge, Scope badge */}
                  <div className="p-5 space-y-4">
                    {/* Dark chip bar: tmpl_... with Copy icon on the right */}
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 shadow-inner">
                      <span className="font-mono text-xs font-semibold text-red-400 truncate">
                        {tmpl.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTemplateId(tmpl.id)}
                        title="Copy Template ID"
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedId === tmpl.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Type Badge with explicit label */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-semibold text-xs">Type:</span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">
                          <span>{sanitizeBadge(tmpl.badge) || 'custom'}</span>
                        </span>
                      </div>

                      {tmpl.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 pt-1 border-t border-white/5">
                          {tmpl.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Wireframe Footer: Load Template + Export + Blue Edit + Red Delete */}
                  <div className="px-5 py-3.5 bg-black/30 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          onLoadTemplate(tmpl.state);
                          showToast(`Template "${tmpl.name}" loaded into canvas!`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Load Template</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Export JSON Button */}
                      <button
                        type="button"
                        onClick={(e) => handleExportTemplate(tmpl, e)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                        title="Export as JSON"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Wireframe Blue Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(tmpl, e)}
                        className="p-2 rounded-xl text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Wireframe Red Delete Button */}
                      {isUserCreated && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteUserTemplate(tmpl.id, e)}
                          className="p-2 rounded-xl text-white bg-red-600 hover:bg-red-500 border border-red-400/30 shadow-md shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {allowCreate && isCreateModalOpen && (
        <div
          className="modal-overlay open"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-bookmark" style={{ color: 'var(--color-primary)' }} />
                <span>Save Template</span>
                <span className="component-modal-badge red">CUSTOM PRESET</span>
              </div>
              <button className="btn-container-close" onClick={() => setIsCreateModalOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Welcome Verification Hub"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Badge</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. onboarding"
                  value={newTemplateBadge}
                  onChange={(e) => setNewTemplateBadge(sanitizeBadge(e.target.value))}
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Single lowercase keyword only (no spaces, no uppercase).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Brief description of this template layout..."
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-btn-save"
                  onClick={handleSaveCurrentAsTemplate}
                >
                  <i className="fa-solid fa-check" style={{ marginRight: '6px' }} />
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div
          className="modal-overlay open"
          onClick={() => setEditingTemplate(null)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-pen-to-square" style={{ color: '#38bdf8' }} />
                <span>Edit Template</span>
                <span className="component-modal-badge blurple">{sanitizeBadge(editingTemplate.badge) || 'custom'}</span>
              </div>
              <button className="btn-container-close" onClick={() => setEditingTemplate(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Template Name"
                  value={editTemplateName}
                  onChange={(e) => setEditTemplateName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Badge</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. onboarding"
                  value={editTemplateBadge}
                  onChange={(e) => setEditTemplateBadge(sanitizeBadge(e.target.value))}
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Single lowercase keyword only (no spaces, no uppercase).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Brief description of this template layout..."
                  value={editTemplateDesc}
                  onChange={(e) => setEditTemplateDesc(e.target.value)}
                />
              </div>

              {currentBuilderState && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <input
                    type="checkbox"
                    id="chk_edit_overwrite_canvas"
                    checked={editOverwriteCanvas}
                    onChange={(e) => setEditOverwriteCanvas(e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="chk_edit_overwrite_canvas" style={{ fontSize: '12px', color: '#e0f2fe', cursor: 'pointer' }}>
                    Overwrite template layout with current builder canvas ({currentBuilderState.type17Containers?.length || 0} container{currentBuilderState.type17Containers?.length !== 1 ? 's' : ''})
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setEditingTemplate(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-ctrl-green"
                  style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: '6px' }}
                  onClick={handleSaveEditTemplate}
                  disabled={isUpdating}
                >
                  <i className={isUpdating ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-check"} style={{ marginRight: '6px' }} />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
