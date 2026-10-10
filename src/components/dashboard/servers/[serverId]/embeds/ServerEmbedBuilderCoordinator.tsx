'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Boxes,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
  type TemplateData,
} from '@/lib/model/embed';
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
import { useEmbedBuilderReducer } from '@/components/dashboard/embeds/useEmbedBuilderReducer';
import { GlobalModeSwitcher } from '@/components/dashboard/embeds/GlobalModeSwitcher';
import { ServerEditTabCoordinator } from './EditTab/ServerEditTabCoordinator';
import { GlobalPreviewCoordinator } from '@/components/dashboard/embeds/PreviewTab/GlobalPreviewCoordinator';
import { ServerScheduleDispatchPanel } from './DispatchTab/ServerScheduleDispatchPanel';
import { MonacoDiscordJsonEditor } from '@/components/dashboard/embeds/RawTab/MonacoDiscordJsonEditor';
import { ServerActionTemplatesTab } from './ServerActionTemplatesTab';
import { ButtonConfigModal } from '@/components/dashboard/embeds/modals/ButtonConfigModal';
import { SelectMenuConfigModal } from '@/components/dashboard/embeds/modals/SelectMenuConfigModal';
import { SaveTemplateModal } from '@/components/dashboard/embeds/modals/SaveTemplateModal';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';
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
    hasPendingDraft,
    restorePendingDraft,
    discardPendingDraft,
  } = useEmbedBuilderReducer();

  const [actions, setActions] = useState<EmbedAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);
  const [embedTemplates, setEmbedTemplates] = useState<TemplateData[]>([]);
  const [activeTabOverride, setActiveTabOverride] = useState<
    'edit' | 'preview' | 'dispatch' | 'raw' | 'actions' | 'templates'
  >('edit');

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

  useEffect(() => {
    let isMounted = true;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    const loadTemplates = async () => {
      try {
        const res = await fetchGlobalTemplates({ page: 0, size: 50 }, token);
        if (isMounted && res.success && res.data) {
          setEmbedTemplates(res.data.content || []);
        }
      } catch {
        // Fallback
      }
    };

    void loadTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

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
        title: 'Registration Failed',
        description: 'Could not register action template.',
      });
    }
  };

  const handleUpdateAction = async (
    actionId: string,
    payload: CreateActionPayload
  ) => {
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
        description: 'Could not update action template.',
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
          title: 'Action Removed',
          description: `Action template ${actionId} deleted.`,
        });
        void loadServerActionsList();
      }
    } catch {
      toast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Could not delete action template.',
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
          serverId,
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
          description: `"${res.data.name}" saved for server #${serverId}.`,
        });
        dispatch({
          type: 'MARK_SAVED',
          templateId: res.data.id,
          templateName: res.data.name,
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Save Failed',
        description: 'Could not save template.',
      });
    }
  };

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
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <Boxes size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Server Components V2 Builder
              </h1>
              <Badge variant="crimson">Guild #{serverId}</Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Guild-scoped interactive builder with pure Discord role hierarchy and Action Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={() => dispatch({ type: 'RESET_CANVAS' })}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsSaveModalOpen(true)}
          >
            Save Layout
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <GlobalModeSwitcher
          activeTab={
            activeTabOverride === 'actions' ? 'edit' : (activeTabOverride as typeof state.activeSubTab)
          }
          onChangeTab={(tab) => {
            setActiveTabOverride(tab);
            dispatch({ type: 'SET_ACTIVE_TAB', tab });
          }}
          templateCount={embedTemplates.length}
          violationCount={validationReport.violations.length}
        />

        <div className="inline-flex rounded-apple-lg bg-zinc-900/90 border border-white/[0.08] p-1">
          <button
            type="button"
            onClick={() => setActiveTabOverride('actions')}
            className={`px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-colors ${
              activeTabOverride === 'actions'
                ? 'bg-brand-red text-white shadow-crimson-glow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Action Registry ({actions.length})
          </button>
        </div>
      </div>

      {activeTabOverride === 'actions' && (
        <ServerActionTemplatesTab
          serverId={serverId}
          actions={actions}
          embedTemplates={embedTemplates}
          loading={loadingActions}
          onCreateAction={handleCreateAction}
          onUpdateAction={handleUpdateAction}
          onDeleteAction={handleDeleteAction}
        />
      )}

      {activeTabOverride !== 'actions' && state.activeSubTab === 'edit' && (
        <ServerEditTabCoordinator
          serverId={serverId}
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
        />
      )}

      {activeTabOverride !== 'actions' && state.activeSubTab === 'preview' && (
        <GlobalPreviewCoordinator
          messageContent={state.message.content}
          containers={state.type17Containers}
        />
      )}

      {activeTabOverride !== 'actions' && state.activeSubTab === 'dispatch' && (
        <ServerScheduleDispatchPanel
          serverId={serverId}
          validationReport={validationReport}
        />
      )}

      {activeTabOverride !== 'actions' && state.activeSubTab === 'raw' && (
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

      {editingButton && (
        <ButtonConfigModal
          isOpen={Boolean(editingButton)}
          button={editingButton.button}
          availableActions={actions}
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
          availableActions={actions}
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
