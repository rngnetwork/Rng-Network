'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  type DiscordButtonComponent,
  type DiscordSelectComponent,
  type DiscordStringSelectComponent,
  type TemplateData,
  type Type17Container,
  ComponentType,
} from '@/lib/model/embed';
import type { EmbedAction } from '@/lib/model/action';
import {
  useEmbedBuilderReducer,
  parseDiscordPayloadToState,
  createDefaultContainer,
} from './useEmbedBuilderReducer';
import { useEmbedHistory } from './useEmbedHistory';
import { EmbedBuilderTopNavBar, type EmbedBuilderTopTab } from './EmbedBuilderTopNavBar';
import { MessageBuilderWorkspace } from './MessageBuilderWorkspace';
import { GlobalEditTabCoordinator } from './EditTab/GlobalEditTabCoordinator';
import { GlobalPreviewCoordinator } from './PreviewTab/GlobalPreviewCoordinator';
import { GlobalDispatchCoordinator } from './DispatchTab/GlobalDispatchCoordinator';
import { MonacoDiscordJsonEditor } from './RawTab/MonacoDiscordJsonEditor';
import { TemplateFilterBar } from './templates/TemplateFilterBar';
import { SavedTemplateCard } from './templates/SavedTemplateCard';
import { ActionTemplatesTab } from './ActionTemplatesTab';
import { PaletteModal } from './modals/PaletteModal';
import { ButtonConfigModal } from './modals/ButtonConfigModal';
import { SelectMenuConfigModal } from './modals/SelectMenuConfigModal';
import { SaveTemplateModal } from './modals/SaveTemplateModal';
import { LoadPresetModal } from './modals/LoadPresetModal';
import { DiscordBotEmojiPicker } from './emoji/DiscordBotEmojiPicker';
import { Modal } from '@/components/common/feedback/Modal';
import {
  fetchGlobalTemplates,
  createTemplate,
  deleteTemplate,
  fetchActionTemplates,
} from '@/lib/api/dashboard/embeds';
import { useToast } from '@/components/common/feedback/ToastProvider';

export const GlobalEmbedBuilderCoordinator: React.FC = () => {
  const { toast } = useToast();
  const [activeTopTab, setActiveTopTab] = useState<EmbedBuilderTopTab>('builder');

  const {
    state,
    dispatch,
    validationReport,
  } = useEmbedBuilderReducer();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('ALL');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [availableActions, setAvailableActions] = useState<EmbedAction[]>([]);

  // Modals state (Rendered at upper z-index z-50)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLoadPresetOpen, setIsLoadPresetOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeEmojiCallback, setActiveEmojiCallback] = useState<((token: string) => void) | null>(null);
  const [targetPaletteContainerIdx, setTargetPaletteContainerIdx] = useState(0);

  const lastFocusedInputRef = useRef<{
    element: HTMLInputElement | HTMLTextAreaElement;
    selectionStart: number;
    selectionEnd: number;
  } | null>(null);

  useEffect(() => {
    const updateCursor = (target: EventTarget | null) => {
      if (
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
        !target.dataset.emojiSearch
      ) {
        lastFocusedInputRef.current = {
          element: target,
          selectionStart: target.selectionStart ?? target.value.length,
          selectionEnd: target.selectionEnd ?? target.value.length,
        };
      }
    };

    const handleFocus = (e: FocusEvent) => updateCursor(e.target);
    const handleInput = (e: Event) => updateCursor(e.target);
    const handleClick = (e: MouseEvent) => updateCursor(e.target);
    const handleKeyUp = (e: KeyboardEvent) => updateCursor(e.target);
    const handleSelectionChange = () => {
      const active = document.activeElement;
      updateCursor(active);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('input', handleInput, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('input', handleInput, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleInsertEmoji = (token: string) => {
    if (activeEmojiCallback) {
      activeEmojiCallback(token);
      setActiveEmojiCallback(null);
      setIsEmojiPickerOpen(false);
      return;
    }

    if (
      lastFocusedInputRef.current &&
      document.body.contains(lastFocusedInputRef.current.element)
    ) {
      const { element, selectionStart, selectionEnd } = lastFocusedInputRef.current;
      const currentVal = element.value;
      const nextVal =
        currentVal.slice(0, selectionStart) + token + currentVal.slice(selectionEnd);

      const proto =
        element instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(element, nextVal);
      } else {
        element.value = nextVal;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.focus();
      const nextCursor = selectionStart + token.length;
      element.setSelectionRange(nextCursor, nextCursor);
      lastFocusedInputRef.current = {
        element,
        selectionStart: nextCursor,
        selectionEnd: nextCursor,
      };
    } else {
      toast({
        type: 'info',
        title: 'Emoji Selected',
        description: `Selected ${token}. Click an input to type or paste.`,
      });
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(token);
      }
    }
    setIsEmojiPickerOpen(false);
  };

  const [editingButton, setEditingButton] = useState<{
    cIdx: number;
    button: DiscordButtonComponent;
  } | null>(null);

  const [editingSelectMenu, setEditingSelectMenu] = useState<{
    cIdx: number;
    selectMenu: DiscordSelectComponent;
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
    void loadTemplatesList();
  }, [loadTemplatesList]);

  const loadActions = useCallback(async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;
    try {
      const res = await fetchActionTemplates(undefined, token);
      if (res.success && Array.isArray(res.data)) {
        setAvailableActions(res.data);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

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
        setIsSaveModalOpen(false);
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
    <div className="w-full flex-1 min-h-0 flex flex-col gap-2 md:gap-2.5 overflow-hidden">
      {/* 1. Top Most Navigation Bar (Separated from Builder) */}
      <EmbedBuilderTopNavBar
        activeTab={activeTopTab}
        onChangeTab={setActiveTopTab}
        templateCount={templates.length}
        actionCount={availableActions.length}
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
          onOpenEmojiPicker={() => {
            setActiveEmojiCallback(null);
            setIsEmojiPickerOpen((prev) => !prev);
          }}
        >
          {state.activeSubTab === 'edit' && (
            <GlobalEditTabCoordinator
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

      {/* 4. Action Templates Tab Mode */}
      {activeTopTab === 'actions' && (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-apple-2xl border border-white/10 bg-surface-card/60 p-4 md:p-5 shadow-apple-card [scrollbar-width:thin]">
          <ActionTemplatesTab
            embedTemplates={templates}
            onActionsUpdated={loadActions}
          />
        </div>
      )}

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
        savedTemplates={templates}
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
        onInsertComponent={(comp) => {
          let targetContainer = state.type17Containers[state.type17Containers.length - 1];
          if (!targetContainer) {
            const newCnt = createDefaultContainer();
            dispatch({ type: 'ADD_CONTAINER', container: newCnt });
            targetContainer = newCnt;
          }
          dispatch({
            type: 'ADD_COMPONENT',
            containerId: targetContainer.id,
            componentType: comp.type,
            initialComponent: comp,
          });
          toast({
            type: 'success',
            title: 'Component Inserted',
            description: 'Inserted component into Container.',
          });
        }}
      />

      {editingButton && (
        <ButtonConfigModal
          isOpen={Boolean(editingButton)}
          button={editingButton.button}
          availableActions={availableActions}
          onOpenEmojiPicker={(cb) => {
            setActiveEmojiCallback(() => cb);
            setIsEmojiPickerOpen(true);
          }}
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
          availableActions={availableActions}
          allContainers={state.type17Containers}
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
          onUpdateContainers={(updatedContainers) => {
            dispatch({
              type: 'SET_CONTAINERS',
              containers: updatedContainers,
            });
          }}
        />
      )}

      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        initialName={state.activeTemplateName}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
      />

      {/* Bottom-Right Floating Discord Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <>
          {/* Invisible click-outside dismisser - NO BLUR, NO BACKDROP */}
          <div
            className="fixed inset-0 z-[59] bg-transparent"
            onClick={() => {
              setIsEmojiPickerOpen(false);
              setActiveEmojiCallback(null);
            }}
          />
          {/* Floating Discord Emoji Picker Popover */}
          <div className="fixed bottom-14 right-6 z-[60] w-[390px] h-[440px] max-w-[calc(100vw-2rem)] rounded-[8px] bg-[#2b2d31] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150">
            <DiscordBotEmojiPicker
              onSelectEmojiToken={handleInsertEmoji}
            />
          </div>
        </>
      )}
    </div>
  );
};
