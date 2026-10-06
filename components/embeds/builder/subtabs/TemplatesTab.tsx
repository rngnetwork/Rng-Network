"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TemplateItem, Type17Container, BackendEmbedTemplate } from '../../types';
import { api } from '@/lib/api';
import { buildDiscordV2MessagePayload, parseDiscordPayloadToState } from '../../validation';

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

const STORAGE_KEY_TEMPLATES = 'rng_discord_user_templates';

export function TemplatesTab({
  currentBuilderState,
  onLoadTemplate,
  allowCreate = true,
  allowSearch = true,
  serverId = 'default'
}: TemplatesTabProps) {
  const [search, setSearch] = useState('');
  const [userTemplates, setUserTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBadge, setNewTemplateBadge] = useState('Custom');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isPublicTemplate, setIsPublicTemplate] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit template state
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateBadge, setEditTemplateBadge] = useState('Custom');
  const [editTemplateDesc, setEditTemplateDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editOverwriteCanvas, setEditOverwriteCanvas] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load templates from API or localStorage
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const effectiveServerId = serverId && serverId !== 'default' ? serverId : undefined;
        const response = await api.fetchTemplates(effectiveServerId ? { serverId: effectiveServerId } : {});
        const rawItems = Array.isArray(response?.data)
          ? response.data
          : Array.isArray((response?.data as unknown as { content?: unknown[] })?.content)
          ? ((response.data as unknown as { content: BackendEmbedTemplate[] }).content)
          : [];

        if (isMounted && rawItems.length > 0) {
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
              badge: bt.category || 'Cloud',
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
        } else if (isMounted) {
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
              if (stored) {
                setUserTemplates(JSON.parse(stored));
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Fallback to local storage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
            if (stored && isMounted) {
              setUserTemplates(JSON.parse(stored));
            }
          } catch {
            // ignore JSON error
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [serverId]);

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

    let assignedId = `tmpl_user_${Date.now()}`;
    try {
      const saveRes = await api.saveTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Custom template',
        category: newTemplateBadge.trim() || 'Custom',
        serverId: effectiveServerId,
        isPublic: isPublicTemplate,
        payload: payloadToSend
      });
      if (saveRes?.data) {
        if (saveRes.data.templateId) assignedId = String(saveRes.data.templateId);
        else if (saveRes.data.id) assignedId = String(saveRes.data.id);
      }
      showToast('Template saved successfully to cloud!');
    } catch {
      showToast('Saved to local browser storage (offline mode).', 'success');
    }

    const newTmpl: TemplateItem = {
      id: assignedId,
      name: newTemplateName.trim(),
      badge: newTemplateBadge.trim() || 'Custom',
      description: newTemplateDesc.trim() || 'Custom user created template.',
      createdAt: new Date().toLocaleDateString(),
      state: JSON.parse(JSON.stringify(templateState))
    };

    const updated = [newTmpl, ...userTemplates];
    setUserTemplates(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    setIsCreateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateBadge('Custom');
    setIsPublicTemplate(false);
  };

  const handleDeleteUserTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    try {
      await api.deleteTemplate(id);
      showToast('Template deleted successfully.');
    } catch {
      showToast('Deleted from local storage.', 'success');
    }

    const updated = userTemplates.filter((t) => t.id !== id);
    setUserTemplates(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleOpenEditModal = (tmpl: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(tmpl);
    setEditTemplateName(tmpl.name);
    setEditTemplateDesc(tmpl.description || '');
    setEditTemplateBadge(tmpl.badge || 'Custom');
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

    try {
      if (editingTemplate.id.startsWith('tmpl_user_')) {
        const createRes = await api.saveTemplate({
          name: editTemplateName.trim(),
          description: editTemplateDesc.trim() || 'Custom template',
          category: editTemplateBadge.trim() || 'Custom',
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
          category: editTemplateBadge.trim() || 'Custom',
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
      badge: editTemplateBadge.trim() || 'Custom',
      description: editTemplateDesc.trim(),
      isPublic: editIsPublic,
      state: JSON.parse(JSON.stringify(targetState))
    };

    const updated = userTemplates.map((t) => t.id === editingTemplate.id ? updatedItem : t);
    setUserTemplates(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
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
          badge: String(parsed.badge || 'Imported'),
          description: String(parsed.description || 'Imported from JSON file.'),
          createdAt: new Date().toLocaleDateString(),
          state: {
            message: { content: parsed.state?.message?.content || '' },
            type17Containers: Array.isArray(parsed.state?.type17Containers) ? parsed.state.type17Containers : []
          }
        };

        const updated = [importedTmpl, ...userTemplates];
        setUserTemplates(updated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
          } catch {
            // ignore
          }
        }
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allTemplates;
    return allTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [allTemplates, search]);

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toastMessage.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${toastMessage.type === 'success' ? '#059669' : '#dc2626'}`,
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          <i className={toastMessage.type === 'success' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-solid fa-circle-exclamation text-red-400'} />
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

      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--color-primary)' }} />
            Discord Templates Gallery
          </h2>
          <p style={{ color: 'var(--color-foreground-muted)', fontSize: '13px', marginTop: '4px' }}>
            Pre-built and custom Type 17 & Components V2 presets. Instant 1-click loading and cloud synchronization.
          </p>
        </div>

        {(allowSearch || allowCreate) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            {allowSearch && (
              <div style={{ position: 'relative', width: '240px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '13px', height: '38px', borderRadius: '8px' }}
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#949ba4', fontSize: '12px' }}
                />
              </div>
            )}

            {/* Import Button */}
            <button
              type="button"
              className="btn-header-action"
              style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => fileInputRef.current?.click()}
              title="Import Template from JSON File"
            >
              <i className="fa-solid fa-file-arrow-up" />
              <span>Import JSON</span>
            </button>

            {/* Create / Save Template Button */}
            {allowCreate && (
              <button
                type="button"
                className="btn-dispatch-submit"
                style={{ width: 'auto', padding: '9px 18px', fontSize: '12.5px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <i className="fa-solid fa-plus" />
                <span>Save Current as Template</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#949ba4', fontSize: '13px' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />
          Loading templates...
        </div>
      )}

      {/* Templates Grid */}
      <div className="templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map((tmpl) => {
          const isUserCreated = userTemplates.some((d) => d.id === tmpl.id);
          return (
            <div
              key={tmpl.id}
              className="template-card"
              style={{
                background: 'rgba(18, 18, 23, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative',
                transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    className="template-badge"
                    style={{
                      background: isUserCreated ? 'rgba(0, 168, 252, 0.15)' : 'rgba(225, 29, 46, 0.15)',
                      color: isUserCreated ? '#00a8fc' : '#FF3B4D',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {tmpl.badge}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(tmpl, e)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '12px' }}
                      title="Edit Template"
                    >
                      <i className="fa-solid fa-pen-to-square hover:text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleExportTemplate(tmpl, e)}
                      style={{ background: 'transparent', border: 'none', color: '#949ba4', cursor: 'pointer', fontSize: '12px' }}
                      title="Export as JSON"
                    >
                      <i className="fa-solid fa-download hover:text-white" />
                    </button>
                    {isUserCreated && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteUserTemplate(tmpl.id, e)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                        title="Delete Template"
                      >
                        <i className="fa-solid fa-trash hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {tmpl.name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#949ba4', lineHeight: 1.45 }}>
                  {tmpl.description}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#6d6f78' }}>
                  {tmpl.state.type17Containers?.length || 0} Container{(tmpl.state.type17Containers?.length || 0) !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  className="btn-ctrl-green"
                  style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '6px' }}
                  onClick={() => {
                    onLoadTemplate(tmpl.state);
                    showToast(`Template "${tmpl.name}" loaded into canvas!`);
                  }}
                >
                  <i className="fa-solid fa-cloud-arrow-down" style={{ marginRight: '6px' }} />
                  Load Template
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#949ba4' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>No templates found</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Try searching for a different keyword or create a new template.</div>
        </div>
      )}

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
                  placeholder="e.g. Onboarding, Moderation, Support"
                  value={newTemplateBadge}
                  onChange={(e) => setNewTemplateBadge(e.target.value)}
                />
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="chk_public_template"
                  checked={isPublicTemplate}
                  onChange={(e) => setIsPublicTemplate(e.target.checked)}
                  style={{ accentColor: '#E11D2E', width: '16px', height: '16px' }}
                />
                <label htmlFor="chk_public_template" style={{ fontSize: '12.5px', color: '#dbdee1', cursor: 'pointer' }}>
                  Make template publicly visible to server members
                </label>
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
                <span className="component-modal-badge blurple">{editingTemplate.badge || 'CUSTOM'}</span>
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
                  placeholder="e.g. Onboarding, Moderation, Support"
                  value={editTemplateBadge}
                  onChange={(e) => setEditTemplateBadge(e.target.value)}
                />
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="chk_edit_public_template"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                />
                <label htmlFor="chk_edit_public_template" style={{ fontSize: '12.5px', color: '#dbdee1', cursor: 'pointer' }}>
                  Make template publicly visible to server members
                </label>
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
