'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
  type TemplateData,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import {
  useEmbedBuilderReducer,
  parseDiscordPayloadToState,
} from './useEmbedBuilderReducer';
import { GlobalModeSwitcher } from './GlobalModeSwitcher';
import { DiscordBotEmojiPicker } from './emoji/DiscordBotEmojiPicker';
import { GlobalEditTabCoordinator } from './EditTab/GlobalEditTabCoordinator';
import { GlobalPreviewCoordinator } from './PreviewTab/GlobalPreviewCoordinator';
import { GlobalDispatchCoordinator } from './DispatchTab/GlobalDispatchCoordinator';
import { MonacoDiscordJsonEditor } from './RawTab/MonacoDiscordJsonEditor';
import { TemplateFilterBar } from './templates/TemplateFilterBar';
import { SavedTemplateCard } from './templates/SavedTemplateCard';
import { ButtonConfigModal } from './modals/ButtonConfigModal';
import { SelectMenuConfigModal } from './modals/SelectMenuConfigModal';
import { SaveTemplateModal } from './modals/SaveTemplateModal';
import {
  fetchGlobalTemplates,
  createTemplate,
  deleteTemplate,
  fetchActionTemplates,
} from '@/lib/api/dashboard/embeds';
import { Button } from '@/components/common/input/Button';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export const GlobalEmbedBuilderCoordinator: React.FC = () => {
  const { toast } = useToast();
  const {
    state,
    dispatch,
    validationReport,
    hasPendingDraft,
    restorePendingDraft,
    discardPendingDraft,
  } = useEmbedBuilderReducer();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('ALL');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [availableActions, setAvailableActions] = useState<EmbedAction[]>([]);

  // Modals state
  const [editingButton, setEditingButton] = useState<{
    containerId: string;
    button: DiscordButtonComponent;
  } | null>(null);
  const [editingSelectMenu, setEditingSelectMenu] = useState<{
    containerId: string;
    selectMenu: DiscordStringSelectComponent;
  } | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const loadTemplatesList = useCallback(async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await fetchGlobalTemplates({ page: 0, size: 50 }, token);
      if (res.success && res.data) {
        setTemplates(res.data.content || []);
      }
    } catch {
      // Handled by empty template list
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplatesInitial = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('rng_access_token') ||
            localStorage.getItem('accessToken') ||
            undefined
          : undefined;

      try {
        const res = await fetchGlobalTemplates({ page: 0, size: 50 }, token);
        if (isMounted && res.success && res.data) {
          setTemplates(res.data.content || []);
        }
      } catch {
        // Handled by empty template list
      } finally {
        if (isMounted) {
          setLoadingTemplates(false);
        }
      }
    };

    void fetchTemplatesInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadActions = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('rng_access_token') ||
            localStorage.getItem('accessToken') ||
            undefined
          : undefined;
      try {
        const res = await fetchActionTemplates(undefined, token);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setAvailableActions(res.data);
        }
      } catch {
        // Fallback
      }
    };
    void loadActions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveTemplate = async (metadata: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
  }) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await createTemplate(
        {
          name: metadata.name,
          description: metadata.description,
          category: metadata.category,
          tags: metadata.tags,
          isPublic: metadata.isPublic,
          payload:
            validationReport.compiledPayload as unknown as Record<string, unknown>,
        },
        token
      );

      if (res.success && res.data) {
        toast({
          type: 'success',
          title: 'Template Saved',
          description: `"${res.data.name}" persisted to MongoDB embed_templates.`,
        });
        dispatch({
          type: 'MARK_SAVED',
          templateId: res.data.id,
          templateName: res.data.name,
        });
        void loadTemplatesList();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to persist template to server.',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await deleteTemplate(templateId, token);
      if (res.success) {
        toast({
          type: 'info',
          title: 'Template Deleted',
          description: 'Template removed from registry.',
        });
        void loadTemplatesList();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Could not delete template.',
      });
    }
  };

  const handleLoadTemplateIntoCanvas = (tpl: TemplateData) => {
    const rawPayload = (tpl.payload || tpl.payloadJson || {}) as Record<string, unknown>;
    try {
      const loaded = parseDiscordPayloadToState(rawPayload);
      dispatch({
        type: 'LOAD_TEMPLATE',
        state: loaded,
        templateId: tpl.id,
        templateName: tpl.name,
      });
      dispatch({ type: 'SET_ACTIVE_TAB', tab: 'edit' });
      toast({
        type: 'success',
        title: 'Template Loaded',
        description: `Loaded "${tpl.name}" into visual editor.`,
      });
    } catch {
      toast({
        type: 'error',
        title: 'Load Failed',
        description: 'Malformed template payload.',
      });
    }
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory =
      templateCategory === 'ALL' || tpl.category === templateCategory;
    const q = templateSearch.toLowerCase();
    const matchesSearch =
      !q ||
      tpl.name.toLowerCase().includes(q) ||
      (tpl.description?.toLowerCase().includes(q) ?? false) ||
      (Array.isArray(tpl.tags) && tpl.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {hasPendingDraft && (
        <div className="p-4 rounded-apple-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-apple-card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-white">
                Unsaved Embed Draft Recovered (SEC-201)
              </h4>
              <p className="text-xs text-zinc-300">
                A draft from a previous session was auto-saved to sessionStorage before expiry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={discardPendingDraft}
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={restorePendingDraft}
            >
              Restore Draft
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Discord Components V2 Embed Builder
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Visual designer, dark-mode simulation, and two-phase dispatch engine (Flags: 32768)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => dispatch({ type: 'RESET_CANVAS' })}
          >
            Reset Canvas
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsSaveModalOpen(true)}
          >
            Save Template
          </Button>
        </div>
      </div>

      <GlobalModeSwitcher
        activeTab={state.activeSubTab}
        onChangeTab={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', tab })}
        templateCount={templates.length}
        violationCount={validationReport.violations.length}
      />

      {state.activeSubTab === 'edit' && (
        <GlobalEditTabCoordinator
          messageContent={state.message.content}
          containers={state.type17Containers}
          onChangeMessageContent={(content) =>
            dispatch({ type: 'SET_MESSAGE_CONTENT', content })
          }
          onAddContainer={() => dispatch({ type: 'ADD_CONTAINER' })}
          onUpdateContainer={(containerId, updates) =>
            dispatch({ type: 'UPDATE_CONTAINER', containerId, updates })
          }
          onRemoveContainer={(containerId) =>
            dispatch({ type: 'REMOVE_CONTAINER', containerId })
          }
          onAddComponent={(containerId, componentType) =>
            dispatch({ type: 'ADD_COMPONENT', containerId, componentType })
          }
          onUpdateComponent={(containerId, componentId, updates) =>
            dispatch({
              type: 'UPDATE_COMPONENT',
              containerId,
              componentId,
              updates,
            })
          }
          onRemoveComponent={(containerId, componentId) =>
            dispatch({ type: 'REMOVE_COMPONENT', containerId, componentId })
          }
          onEditButton={(containerId, button) =>
            setEditingButton({ containerId, button })
          }
          onEditSelectMenu={(containerId, selectMenu) =>
            setEditingSelectMenu({ containerId, selectMenu })
          }
          emojiPickerSlot={
            <div className="max-w-md">
              <DiscordBotEmojiPicker
                onSelectEmojiToken={(token) => {
                  dispatch({
                    type: 'SET_MESSAGE_CONTENT',
                    content: state.message.content
                      ? `${state.message.content} ${token}`
                      : token,
                  });
                }}
              />
            </div>
          }
        />
      )}

      {state.activeSubTab === 'preview' && (
        <GlobalPreviewCoordinator
          messageContent={state.message.content}
          containers={state.type17Containers}
        />
      )}

      {state.activeSubTab === 'dispatch' && (
        <GlobalDispatchCoordinator validationReport={validationReport} />
      )}

      {state.activeSubTab === 'raw' && (
        <MonacoDiscordJsonEditor
          compiledPayload={validationReport.compiledPayload}
          onApplyParsedState={(parsed) => {
            dispatch({ type: 'LOAD_TEMPLATE', state: parsed });
            toast({
              type: 'success',
              title: 'Payload Synced',
              description: 'JSON state synchronized with visual canvas.',
            });
          }}
        />
      )}

      {state.activeSubTab === 'templates' && (
        <div className="flex flex-col gap-6">
          <TemplateFilterBar
            searchQuery={templateSearch}
            selectedCategory={templateCategory}
            onChangeSearch={setTemplateSearch}
            onChangeCategory={setTemplateCategory}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
          />

          {loadingTemplates ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Loading saved templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <SavedTemplateCard
              onCreateFirstTemplate={() => setIsSaveModalOpen(true)}
              onLoadTemplate={() => {}}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl) => (
                <SavedTemplateCard
                  key={tpl.id}
                  template={tpl}
                  onLoadTemplate={handleLoadTemplateIntoCanvas}
                  onDeleteTemplate={handleDeleteTemplate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {editingButton && (
        <ButtonConfigModal
          isOpen={Boolean(editingButton)}
          button={editingButton.button}
          availableActions={availableActions}
          onClose={() => setEditingButton(null)}
          onSave={(updatedBtn) => {
            if (updatedBtn.id) {
              dispatch({
                type: 'UPDATE_COMPONENT',
                containerId: editingButton.containerId,
                componentId: updatedBtn.id,
                updates: updatedBtn,
              });
            }
          }}
        />
      )}

      {editingSelectMenu && (
        <SelectMenuConfigModal
          isOpen={Boolean(editingSelectMenu)}
          selectMenu={editingSelectMenu.selectMenu}
          availableActions={availableActions}
          onClose={() => setEditingSelectMenu(null)}
          onSave={(updatedMenu) => {
            if (updatedMenu.id) {
              dispatch({
                type: 'UPDATE_COMPONENT',
                containerId: editingSelectMenu.containerId,
                componentId: updatedMenu.id,
                updates: updatedMenu,
              });
            }
          }}
        />
      )}

      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        initialName={state.activeTemplateName}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};
