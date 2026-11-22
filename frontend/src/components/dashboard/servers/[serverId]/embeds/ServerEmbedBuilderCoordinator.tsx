'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { fetchServers } from '@/lib/api/dashboard/servers';
import type { ServerItem } from '@/lib/model/server';
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
  const [servers, setServers] = useState<ServerItem[]>([]);

  // Modals state (Rendered at upper z-index z-50)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isLoadPresetOpen, setIsLoadPresetOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeEmojiCallback, setActiveEmojiCallback] = useState<((token: string) => void) | null>(null);
  const [selectedContainerIdx, setSelectedContainerIdx] = useState(0);
  const [targetPaletteContainerIdx, setTargetPaletteContainerIdx] = useState(0);

  const activeSelectedIdx = useMemo(() => {
    if (state.type17Containers.length === 0) return 0;
    return Math.max(0, Math.min(selectedContainerIdx, state.type17Containers.length - 1));
  }, [selectedContainerIdx, state.type17Containers.length]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEmojiPickerOpen) {
        e.stopPropagation();
        setIsEmojiPickerOpen(false);
        setActiveEmojiCallback(null);
      }
    };
    if (isEmojiPickerOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isEmojiPickerOpen]);

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
    isEnabled: state.activeSubTab === 'edit',
  });

    useEffect(() => {
    let isMounted = true;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    if (serverId) {
      fetchServerActions(serverId, undefined, undefined, token)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setActions(res.data);
          }
        })
        .catch(() => {});
    }

    fetchServers(token)
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setServers(res.data);
        }
      })
      .catch(() => {});

    fetchGlobalTemplates({ serverId, page: 0, size: 100 }, token)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setEmbedTemplates(res.data.content || []);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const snowflakeToSlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    servers.forEach((s) => {
      if (s.id) map[s.id] = s.slug || s.id;
      if (s.slug) map[s.slug] = s.slug;
    });
    return map;
  }, [servers]);

  const currentServerSlug = useMemo(() => {
    const matched = servers.find((s) => s.slug === serverId || s.id === serverId);
    return matched?.slug || serverId;
  }, [servers, serverId]);

  const currentServerSnowflake = useMemo(() => {
    const matched = servers.find((s) => s.slug === serverId || s.id === serverId);
    return matched?.id || serverId;
  }, [servers, serverId]);

  const handleSaveTemplate = async (meta: {
    name: string;
    description: string;
    category: string;
    tags?: string[];
    isPublic: boolean;
    serverId?: string;
    serverIds?: string[];
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
          tags: meta.tags || [],
          isPublic: meta.isPublic,
          serverId: (meta.serverIds && meta.serverIds.length > 0 ? meta.serverIds[0] : meta.serverId) || serverId,
          serverIds: meta.serverIds && meta.serverIds.length > 0 ? meta.serverIds : (meta.serverId ? [meta.serverId] : (serverId ? [serverId] : [])),
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
        onAddContainer={() => {
          const newCnt = createDefaultContainer();
          dispatch({ type: 'ADD_CONTAINER', container: newCnt });
          setSelectedContainerIdx(state.type17Containers.length);
        }}
        onAddActionRow={() => dispatch({ type: 'ADD_ACTION_ROW', containerIndex: activeSelectedIdx })}
        onOpenPaletteModal={() => {
          setTargetPaletteContainerIdx(activeSelectedIdx);
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
            selectedContainerIdx={activeSelectedIdx}
            onSelectContainer={setSelectedContainerIdx}
            onChangeMessageContent={(content) =>
              dispatch({ type: 'SET_MESSAGE_CONTENT', content })
            }
            onAddContainer={() => {
              const newCnt = createDefaultContainer();
              dispatch({ type: 'ADD_CONTAINER', container: newCnt });
              setSelectedContainerIdx(state.type17Containers.length);
            }}
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
                if (selectedContainerIdx >= cIdx) {
                  setSelectedContainerIdx(Math.max(0, selectedContainerIdx - 1));
                }
              }
            }}
            onMoveContainer={(fromIdx, direction) => {
              const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
              dispatch({ type: 'MOVE_CONTAINER', fromIndex: fromIdx, toIndex: toIdx });
            }}
            onMoveComponent={(containerIndex, fromIndex, toIndex) =>
              dispatch({ type: 'MOVE_COMPONENT', containerIndex, fromIndex, toIndex })
            }
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
              setSelectedContainerIdx(cIdx);
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
          const targetContainer =
            state.type17Containers[targetPaletteContainerIdx] ||
            state.type17Containers[activeSelectedIdx];
          if (targetContainer) {
            dispatch({ type: 'ADD_COMPONENT', containerId: targetContainer.id, componentType });
          }
        }}
      />

      <LoadPresetModal
        isOpen={isLoadPresetOpen}
        onClose={() => setIsLoadPresetOpen(false)}
        savedTemplates={embedTemplates}
        currentServerId={serverId}
        currentServerSlug={currentServerSlug}
        currentServerSnowflake={currentServerSnowflake}
        snowflakeToSlugMap={snowflakeToSlugMap}
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
          let targetContainer =
            state.type17Containers[targetPaletteContainerIdx] ||
            state.type17Containers[activeSelectedIdx];
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
          availableActions={actions}
          allContainers={state.type17Containers}
          onOpenEmojiPicker={(cb) => {
            setActiveEmojiCallback(() => cb);
            setIsEmojiPickerOpen(true);
          }}
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
        serverId={serverId}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
      />

      {/* Bottom-Right Floating Discord Emoji Picker Popover */}
      {isEmojiPickerOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Invisible click-outside dismisser - NO BLUR, NO BACKDROP */}
          <div
            className="fixed inset-0 z-[99] bg-transparent"
            onClick={() => {
              setIsEmojiPickerOpen(false);
              setActiveEmojiCallback(null);
            }}
          />
          {/* Floating Discord Emoji Picker Popover */}
          <div className="fixed bottom-14 right-6 z-[100] w-[390px] h-[440px] max-w-[calc(100vw-2rem)] rounded-[8px] bg-[#2b2d31] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-150">
            <ServerDiscordEmojiPicker
              serverId={serverId}
              onSelectEmojiToken={handleInsertEmoji}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
