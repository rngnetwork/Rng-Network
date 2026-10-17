'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  type DiscordButtonComponent,
  type DiscordSelectComponent,
  type TemplateData,
} from '@/lib/model/embed';
import {
  useEmbedBuilderReducer,
  createDefaultContainer,
} from '@/components/dashboard/embeds/useEmbedBuilderReducer';
import type { EmbedAction } from '@/lib/model/action';
import {
  fetchServerActions,
} from '@/lib/api/dashboard/servers/[serverId]/embeds';
import {
  fetchGlobalTemplates,
  createTemplate,
} from '@/lib/api/dashboard/embeds';
import { useEmbedHistory } from '@/components/dashboard/embeds/useEmbedHistory';
import { MessageBuilderWorkspace } from '@/components/dashboard/embeds/MessageBuilderWorkspace';
import { GlobalEditTabCoordinator } from '@/components/dashboard/embeds/EditTab/GlobalEditTabCoordinator';
import { GlobalPreviewCoordinator } from '@/components/dashboard/embeds/PreviewTab/GlobalPreviewCoordinator';
import { GlobalDispatchCoordinator } from '@/components/dashboard/embeds/DispatchTab/GlobalDispatchCoordinator';
import { MonacoDiscordJsonEditor } from '@/components/dashboard/embeds/RawTab/MonacoDiscordJsonEditor';
import { PaletteModal } from '@/components/dashboard/embeds/modals/PaletteModal';
import { ButtonConfigModal } from '@/components/dashboard/embeds/modals/ButtonConfigModal';
import { SelectMenuConfigModal } from '@/components/dashboard/embeds/modals/SelectMenuConfigModal';
import { SaveTemplateModal } from '@/components/dashboard/embeds/modals/SaveTemplateModal';
import { LoadPresetModal } from '@/components/dashboard/embeds/modals/LoadPresetModal';
import { ServerDiscordEmojiPicker } from './emoji/ServerDiscordEmojiPicker';
import { Modal } from '@/components/common/feedback/Modal';
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

  const {
    state,
    dispatch,
    validationReport,
  } = useEmbedBuilderReducer();

  const [actions, setActions] = useState<EmbedAction[]>([]);
  const [embedTemplates, setEmbedTemplates] = useState<TemplateData[]>([]);

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
    isEnabled: state.activeSubTab === 'edit',
  });

  const loadServerActions = useCallback(async () => {
    if (!serverId) return;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await fetchServerActions(serverId, undefined, undefined, token);
      if (res.success && res.data) {
        setActions(res.data);
      }
    } catch {
      // Handled silently
    }
  }, [serverId]);

  const loadGlobalTemplates = useCallback(async () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const res = await fetchGlobalTemplates(undefined, token);
      if (res.success && res.data) {
        setEmbedTemplates(res.data.content || []);
      }
    } catch {
      // Handled silently
    }
  }, []);

  useEffect(() => {
    void loadServerActions();
    void loadGlobalTemplates();
  }, [loadServerActions, loadGlobalTemplates]);

  const handleSaveTemplate = async (meta: {
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
          name: meta.name,
          description: meta.description,
          category: meta.category,
          tags: meta.tags,
          isPublic: meta.isPublic,
          payload: validationReport.compiledPayload as unknown as Record<string, unknown>,
        },
        token
      );

      if (res.success && res.data) {
        setEmbedTemplates((prev) => [res.data, ...prev]);
        setIsSaveModalOpen(false);
        toast({
          type: 'success',
          title: 'Template Saved',
          description: `Template "${meta.name}" persisted.`,
        });
      } else {
        toast({
          type: 'error',
          title: 'Save Failed',
          description: res.message || 'Failed to persist template.',
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to persist template to server.',
      });
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col gap-2 md:gap-2.5 overflow-hidden">
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

      <Modal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        title="Select Server Emoji"
        size="md"
      >
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
      </Modal>
    </div>
  );
};
