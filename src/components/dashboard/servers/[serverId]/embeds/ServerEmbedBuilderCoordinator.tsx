'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
  type TemplateData,
} from '@/lib/model/embed';
import {
  useEmbedBuilderReducer,
  parseDiscordPayloadToState,
} from '@/components/dashboard/embeds/useEmbedBuilderReducer';
import type { EmbedAction, CreateActionPayload } from '@/lib/model/action';
import {
  fetchServerActions,
  createServerAction,
  updateServerAction,
  deleteServerAction,
} from '@/lib/api/dashboard/servers/[serverId]/embeds';
import {
  fetchGlobalTemplates,
  createTemplate,
} from '@/lib/api/dashboard/embeds';
import { useEmbedHistory } from '@/components/dashboard/embeds/useEmbedHistory';
import { EmbedBuilderTopNavBar, type EmbedBuilderTopTab } from '@/components/dashboard/embeds/EmbedBuilderTopNavBar';
import { MessageBuilderWorkspace } from '@/components/dashboard/embeds/MessageBuilderWorkspace';
import { ServerEditTabCoordinator } from './EditTab/ServerEditTabCoordinator';
import { GlobalPreviewCoordinator } from '@/components/dashboard/embeds/PreviewTab/GlobalPreviewCoordinator';
import { GlobalDispatchCoordinator } from '@/components/dashboard/embeds/DispatchTab/GlobalDispatchCoordinator';
import { MonacoDiscordJsonEditor } from '@/components/dashboard/embeds/RawTab/MonacoDiscordJsonEditor';
import { ServerActionTemplatesTab } from './ServerActionTemplatesTab';
import { UnsavedChangesBar } from '@/components/dashboard/embeds/UnsavedChangesBar';
import { TemplateFilterBar } from '@/components/dashboard/embeds/templates/TemplateFilterBar';
import { SavedTemplateCard } from '@/components/dashboard/embeds/templates/SavedTemplateCard';
import { PaletteModal } from '@/components/dashboard/embeds/modals/PaletteModal';
import { ButtonConfigModal } from '@/components/dashboard/embeds/modals/ButtonConfigModal';
import { SelectMenuConfigModal } from '@/components/dashboard/embeds/modals/SelectMenuConfigModal';
import { SaveTemplateModal } from '@/components/dashboard/embeds/modals/SaveTemplateModal';
import { LoadPresetModal } from '@/components/dashboard/embeds/modals/LoadPresetModal';
import { ServerDiscordEmojiPicker } from './emoji/ServerDiscordEmojiPicker';
import { useToast } from '@/components/common/feedback/ToastProvider';

export interface ServerEmbedBuilderCoordinatorProps {
  serverId?: string;
}

export const ServerEmbedBuilderCoordinator: React.FC<
  ServerEmbedBuilderCoordinatorProps
> = ({ serverId: propServerId }) => {
  const params = useParams();
  const serverId = propServerId || (params?.serverId as string) || '';
  const { toast } = useToast();
  const [activeTopTab, setActiveTopTab] = useState<EmbedBuilderTopTab>('builder');

  const {
    state,
    dispatch,
    validationReport,
  } = useEmbedBuilderReducer();

  const [actions, setActions] = useState<EmbedAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);
  const [embedTemplates, setEmbedTemplates] = useState<TemplateData[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('ALL');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Modals state (Rendered at upper z-index z-50)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLoadPresetOpen, setIsLoadPresetOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [targetPaletteContainerIdx, setTargetPaletteContainerIdx] = useState(0);

  const [editingButton, setEditingButton] = useState<{
    cIdx: number;
    button: DiscordButtonComponent;
  } | null>(null);

  const [editingSelectMenu, setEditingSelectMenu] = useState<{
    cIdx: number;
    selectMenu: DiscordStringSelectComponent;
  } | null>(null);

  // Undo / Redo History Stack Hook
  const history = useEmbedHistory({
    containers: state.type17Containers,
    messageContent: state.message.content,
    onRestoreSnapshot: (snapshot) => {
      dispatch({
        type: 'LOAD_TEMPLATE',
        state: {
          message: { content: snapshot.messageContent },
          type17Containers: snapshot.containers,
        },
      });
    },
    isEnabled: activeTopTab === 'builder' && state.activeSubTab === 'edit',
  });

  const loadServerActionsList = useCallback(async () => {
    if (!serverId) return;
    setLoadingActions(true);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await fetchServerActions(serverId, 0, 50, token);
      if (res.success && Array.isArray(res.data)) {
        setActions(res.data);
      }
    } catch {
      // Handled by empty list
    } finally {
      setLoadingActions(false);
    }
  }, [serverId]);

  useEffect(() => {
    void loadServerActionsList();
  }, [loadServerActionsList]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await fetchGlobalTemplates({ page: 0, size: 50 }, token);
      if (res.success && res.data) {
        setEmbedTemplates(res.data.content || []);
      }
    } catch {
      // Handled by empty list
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleCreateAction = async (payload: CreateActionPayload) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await createServerAction(serverId, payload, token);
      if (res.success) {
        toast({
          type: 'success',
          title: 'Action Registered',
          description: `Action template ${res.data.actionId} created.`,
        });
        void loadServerActionsList();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Action Failed',
        description: 'Failed to create server action.',
      });
    }
  };

  const handleUpdateAction = async (actionId: string, payload: CreateActionPayload) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await updateServerAction(actionId, payload, token);
      if (res.success) {
        toast({
          type: 'success',
          title: 'Action Updated',
          description: `Action template ${actionId} updated.`,
        });
        void loadServerActionsList();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update server action.',
      });
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await deleteServerAction(actionId, token);
      if (res.success) {
        toast({
          type: 'info',
          title: 'Action Deleted',
          description: `Action ${actionId} deleted from server registry.`,
        });
        void loadServerActionsList();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Could not delete server action.',
      });
    }
  };

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
          serverId,
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
        setIsSaveModalOpen(false);
        void loadTemplates();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to persist template to server.',
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
      setActiveTopTab('builder');
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

  const filteredTemplates = embedTemplates.filter((tpl) => {
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
    <div className="w-full h-full max-h-full flex-1 min-h-0 flex flex-col gap-2.5 md:gap-3 overflow-hidden">
      {/* 1. Top Most Navigation Bar (Separated from Builder) */}
      <EmbedBuilderTopNavBar
        activeTab={activeTopTab}
        onChangeTab={setActiveTopTab}
        templateCount={embedTemplates.length}
        actionCount={actions.length}
      />

      {/* 2. Builder Mode Workspace */}
      {activeTopTab === 'builder' && (
        <MessageBuilderWorkspace
          activeSubTab={state.activeSubTab}
          onChangeSubTab={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', tab })}
          containerCount={state.type17Containers.length}
          totalComponents={validationReport.totalComponents}
          onAddContainer={() => dispatch({ type: 'ADD_CONTAINER' })}
          onAddActionRow={() => dispatch({ type: 'ADD_ACTION_ROW', containerIndex: 0 })}
          onOpenPaletteModal={() => {
            setTargetPaletteContainerIdx(0);
            setIsPaletteOpen(true);
          }}
          onOpenLoadModal={() => setIsLoadPresetOpen(true)}
          onClearCanvas={() => dispatch({ type: 'RESET_CANVAS' })}
          onUndo={history.undo}
          onRedo={history.redo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onOpenEmojiPicker={() => setIsEmojiPickerOpen(true)}
        >
          {state.activeSubTab === 'edit' && (
            <ServerEditTabCoordinator
              serverId={serverId}
              messageContent={state.message.content}
              containers={state.type17Containers}
              onChangeMessageContent={(content) =>
                dispatch({ type: 'SET_MESSAGE_CONTENT', content })
              }
              onAddContainer={() => dispatch({ type: 'ADD_CONTAINER' })}
              onUpdateContainer={(cIdx, updates) => {
                const targetId = state.type17Containers[cIdx]?.id;
                if (targetId) {
                  dispatch({ type: 'UPDATE_CONTAINER', containerId: targetId, updates });
                }
              }}
              onRemoveContainer={(cIdx) => {
                const targetId = state.type17Containers[cIdx]?.id;
                if (targetId) {
                  dispatch({ type: 'REMOVE_CONTAINER', containerId: targetId });
                }
              }}
              onMoveContainer={(fromIdx, direction) => {
                const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
                dispatch({ type: 'MOVE_CONTAINER', fromIndex: fromIdx, toIndex: toIdx });
              }}
              onUpdateAuthor={(cIdx, key, val) => {
                const target = state.type17Containers[cIdx];
                if (target) {
                  const updatedAuthor = { ...target.author, [key]: val, name: key === 'name' ? val : target.author?.name || '' };
                  dispatch({ type: 'UPDATE_CONTAINER', containerId: target.id, updates: { author: updatedAuthor } });
                }
              }}
              onUpdateFooter={(cIdx, key, val) => {
                const target = state.type17Containers[cIdx];
                if (target) {
                  const updatedFooter = { ...target.footer, [key]: val, text: key === 'text' ? val : target.footer?.text || '' };
                  dispatch({ type: 'UPDATE_CONTAINER', containerId: target.id, updates: { footer: updatedFooter } });
                }
              }}
              onAddField={(cIdx) => dispatch({ type: 'ADD_FIELD', containerIndex: cIdx })}
              onUpdateField={(cIdx, fIdx, key, val) =>
                dispatch({ type: 'UPDATE_FIELD', containerIndex: cIdx, fieldIndex: fIdx, updates: { [key]: val } })
              }
              onRemoveField={(cIdx, fIdx) =>
                dispatch({ type: 'REMOVE_FIELD', containerIndex: cIdx, fieldIndex: fIdx })
              }
              onAddComponent={(cIdx, componentType) => {
                const targetId = state.type17Containers[cIdx]?.id;
                if (targetId) {
                  dispatch({ type: 'ADD_COMPONENT', containerId: targetId, componentType });
                }
              }}
              onUpdateComponent={(cIdx, compIdx, updates) => {
                const targetContainer = state.type17Containers[cIdx];
                const targetCompId = targetContainer?.components[compIdx]?.id;
                if (targetContainer && targetCompId) {
                  dispatch({
                    type: 'UPDATE_COMPONENT',
                    containerId: targetContainer.id,
                    componentId: targetCompId,
                    updates,
                  });
                }
              }}
              onRemoveComponent={(cIdx, compIdx) => {
                const targetContainer = state.type17Containers[cIdx];
                const targetCompId = targetContainer?.components[compIdx]?.id;
                if (targetContainer && targetCompId) {
                  dispatch({
                    type: 'REMOVE_COMPONENT',
                    containerId: targetContainer.id,
                    componentId: targetCompId,
                  });
                }
              }}
              onDuplicateComponent={(cIdx, compIdx) =>
                dispatch({ type: 'DUPLICATE_COMPONENT', containerIndex: cIdx, componentIndex: compIdx })
              }
              onEditButton={(cIdx, button) =>
                setEditingButton({ cIdx, button })
              }
              onEditSelectMenu={(cIdx, selectMenu) =>
                setEditingSelectMenu({ cIdx, selectMenu })
              }
              onOpenPaletteModal={(cIdx) => {
                setTargetPaletteContainerIdx(cIdx);
                setIsPaletteOpen(true);
              }}
              onOpenEmojiPicker={() => setIsEmojiPickerOpen(true)}
            />
          )}

          {state.activeSubTab === 'preview' && (
            <GlobalPreviewCoordinator
              messageContent={state.message.content}
              containers={state.type17Containers}
            />
          )}

          {state.activeSubTab === 'dispatch' && (
            <GlobalDispatchCoordinator
              validationReport={validationReport}
              fixedServerId={serverId}
            />
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
        </MessageBuilderWorkspace>
      )}

      {/* 3. Templates Tab Mode */}
      {activeTopTab === 'templates' && (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-apple-2xl border border-white/10 bg-surface-card/60 p-4 md:p-5 shadow-apple-card flex flex-col gap-6 [scrollbar-width:thin]">
          <TemplateFilterBar
            searchQuery={templateSearch}
            selectedCategory={templateCategory}
            onChangeSearch={setTemplateSearch}
            onChangeCategory={setTemplateCategory}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
          />

          {loadingTemplates ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Loading templates...
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
                  onDeleteTemplate={async () => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Action Templates Tab Mode */}
      {activeTopTab === 'actions' && (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-apple-2xl border border-white/10 bg-surface-card/60 p-4 md:p-5 shadow-apple-card [scrollbar-width:thin]">
          <ServerActionTemplatesTab
            serverId={serverId}
            actions={actions}
            embedTemplates={embedTemplates}
            loading={loadingActions}
            onCreateAction={handleCreateAction}
            onUpdateAction={handleUpdateAction}
            onDeleteAction={handleDeleteAction}
          />
        </div>
      )}

      {/* Floating Unsaved Changes Bar */}
      <UnsavedChangesBar
        isDirty={state.isDirty}
        onSave={() => setIsSaveModalOpen(true)}
        onReset={() => dispatch({ type: 'RESET_CANVAS' })}
      />

      {/* UPPER Z-INDEX MODALS LAYER (z-50) */}
      <PaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectComponent={(componentType) => {
          const targetId = state.type17Containers[targetPaletteContainerIdx]?.id;
          if (targetId) {
            dispatch({ type: 'ADD_COMPONENT', containerId: targetId, componentType });
          }
        }}
      />

      <LoadPresetModal
        isOpen={isLoadPresetOpen}
        onClose={() => setIsLoadPresetOpen(false)}
        savedTemplates={embedTemplates}
        onLoadTemplate={(loadedState, name) => {
          dispatch({
            type: 'LOAD_TEMPLATE',
            state: loadedState,
            templateName: name,
          });
          toast({
            type: 'success',
            title: 'Preset Loaded',
            description: `Loaded "${name || 'Preset'}" into editor.`,
          });
        }}
      />

      {editingButton && (
        <ButtonConfigModal
          isOpen={Boolean(editingButton)}
          button={editingButton.button}
          availableActions={actions}
          onClose={() => setEditingButton(null)}
          onSave={(updatedBtn) => {
            if (updatedBtn.id) {
              const targetContainer = state.type17Containers[editingButton.cIdx];
              if (targetContainer) {
                dispatch({
                  type: 'UPDATE_COMPONENT',
                  containerId: targetContainer.id,
                  componentId: updatedBtn.id,
                  updates: updatedBtn,
                });
              }
            }
          }}
        />
      )}

      {editingSelectMenu && (
        <SelectMenuConfigModal
          isOpen={Boolean(editingSelectMenu)}
          selectMenu={editingSelectMenu.selectMenu}
          availableActions={actions}
          onClose={() => setEditingSelectMenu(null)}
          onSave={(updatedMenu) => {
            if (updatedMenu.id) {
              const targetContainer = state.type17Containers[editingSelectMenu.cIdx];
              if (targetContainer) {
                dispatch({
                  type: 'UPDATE_COMPONENT',
                  containerId: targetContainer.id,
                  componentId: updatedMenu.id,
                  updates: updatedMenu,
                });
              }
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

      {isEmojiPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-white/15 rounded-apple-2xl p-4 shadow-apple-elevated max-w-md w-full">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-sm font-bold text-white">Select Server Emoji</span>
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <ServerDiscordEmojiPicker
              serverId={serverId}
              onSelectEmojiToken={(token) => {
                dispatch({
                  type: 'SET_MESSAGE_CONTENT',
                  content: state.message.content
                    ? `${state.message.content} ${token}`
                    : token,
                });
                setIsEmojiPickerOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
