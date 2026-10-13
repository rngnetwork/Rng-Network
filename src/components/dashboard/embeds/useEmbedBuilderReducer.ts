'use client';

import { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ComponentType,
  DISCORD_SAFE_URL_REGEX,
  type DiscordActionRowComponent,
  type DiscordButtonComponent,
  type DiscordContainerChildComponent,
  type DiscordInnerComponent,
  type DiscordMediaGalleryComponent,
  type DiscordSectionComponent,
  type DiscordSeparatorComponent,
  type DiscordStringSelectComponent,
  type DiscordTextDisplayComponent,
  type DiscordTopLevelComponent,
  type DiscordV2ContainerPayload,
  type DiscordV2MessagePayload,
  type MessageBuilderState,
  type Type17Container,
  type ClientValidationReport,
  type ClientValidationViolation,
} from '@/lib/model/embed';
import { hexToInt, intToHex } from '@/components/common/input/ColorPicker';

export const EMBED_DRAFT_STORAGE_KEY = 'rng_unsaved_embed_draft';

export interface EmbedBuilderReducerState extends MessageBuilderState {
  isDirty: boolean;
  activeTemplateId: string | null;
  activeTemplateName: string;
}

export type EmbedBuilderAction =
  | { type: 'SET_ACTIVE_TAB'; tab: MessageBuilderState['activeSubTab'] }
  | { type: 'SET_RAW_PAYLOAD_MODE'; mode: MessageBuilderState['rawPayloadMode'] }
  | { type: 'SET_MESSAGE_CONTENT'; content: string }
  | { type: 'ADD_CONTAINER'; container?: Partial<Type17Container> }
  | { type: 'UPDATE_CONTAINER'; containerId: string; updates: Partial<Type17Container> }
  | { type: 'REMOVE_CONTAINER'; containerId: string }
  | { type: 'MOVE_CONTAINER'; fromIndex: number; toIndex: number }
  | { type: 'ADD_FIELD'; containerIndex: number }
  | {
      type: 'UPDATE_FIELD';
      containerIndex: number;
      fieldIndex: number;
      updates: Partial<{ name: string; value: string; inline: boolean }>;
    }
  | { type: 'REMOVE_FIELD'; containerIndex: number; fieldIndex: number }
  | { type: 'ADD_ACTION_ROW'; containerIndex?: number }
  | { type: 'DUPLICATE_COMPONENT'; containerIndex: number; componentIndex: number }
  | {
      type: 'ADD_COMPONENT';
      containerId: string;
      componentType: ComponentType;
      initialComponent?: DiscordInnerComponent;
    }
  | {
      type: 'UPDATE_COMPONENT';
      containerId: string;
      componentId: string;
      updates: Partial<DiscordInnerComponent>;
    }
  | {
      type: 'REMOVE_COMPONENT';
      containerId: string;
      componentId: string;
    }
  | {
      type: 'REORDER_COMPONENTS';
      containerId: string;
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: 'LOAD_TEMPLATE';
      state: Pick<MessageBuilderState, 'message' | 'type17Containers'>;
      templateId?: string | null;
      templateName?: string;
    }
  | { type: 'RESTORE_DRAFT'; draft: EmbedBuilderReducerState }
  | { type: 'RESET_CANVAS' }
  | { type: 'MARK_SAVED'; templateId?: string | null; templateName?: string };

let idCounter = 1;
export function createComponentId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function createDefaultContainer(overrides?: Partial<Type17Container>): Type17Container {
  return {
    id: overrides?.id || createComponentId('cnt'),
    accentColor: overrides?.accentColor || '#E11D2E',
    isSpoiler: overrides?.isSpoiler ?? false,
    title: overrides?.title ?? 'Operational Briefing',
    description:
      overrides?.description ??
      'Configure your Discord Components V2 container layout and interactive controls below.',
    components: overrides?.components ?? [
      {
        type: ComponentType.TEXT_DISPLAY,
        id: createComponentId('txt'),
        content: '### RNG Command Directive\nAll personnel must verify their clearance prior to dispatch.',
      },
    ],
  };
}

export function createInitialEmbedBuilderState(): EmbedBuilderReducerState {
  return {
    activeSubTab: 'edit',
    rawPayloadMode: 'message',
    message: {
      content: '',
    },
    type17Containers: [createDefaultContainer({ id: 'cnt_initial_1' })],
    isDirty: false,
    activeTemplateId: null,
    activeTemplateName: 'Untitled Components V2 Layout',
  };
}

export function createDefaultInnerComponent(componentType: ComponentType): DiscordInnerComponent {
  switch (componentType) {
    case ComponentType.BUTTON: {
      const btn: DiscordButtonComponent = {
        type: ComponentType.BUTTON,
        id: createComponentId('btn'),
        style: 1,
        label: 'Execute Action',
        custom_id: `rng_act_${Math.random().toString(16).slice(2, 10).padEnd(16, '0').slice(0, 16)}`,
        disabled: false,
      };
      return btn;
    }
    case ComponentType.STRING_SELECT: {
      const select: DiscordStringSelectComponent = {
        type: ComponentType.STRING_SELECT,
        id: createComponentId('sel'),
        custom_id: `rng_sel_${Math.random().toString(16).slice(2, 10)}`,
        placeholder: 'Select an operational option...',
        min_values: 1,
        max_values: 1,
        options: [
          {
            label: 'Primary Clearance',
            value: 'opt_primary',
            description: 'Standard personnel authorization',
          },
        ],
      };
      return select;
    }
    case ComponentType.ACTION_ROW: {
      const row: DiscordActionRowComponent = {
        type: ComponentType.ACTION_ROW,
        id: createComponentId('row'),
        components: [
          {
            type: ComponentType.BUTTON,
            id: createComponentId('btn'),
            style: 1,
            label: 'Primary Button',
            custom_id: 'rng_act_0000000000000001',
          },
        ],
      };
      return row;
    }
    case ComponentType.SECTION: {
      const sec: DiscordSectionComponent = {
        type: ComponentType.SECTION,
        id: createComponentId('sec'),
        components: [
          {
            type: ComponentType.TEXT_DISPLAY,
            id: createComponentId('txt'),
            content: '**Section Header**\nSupporting details paired with an accessory.',
          },
        ],
        accessory: {
          type: ComponentType.BUTTON,
          id: createComponentId('acc_btn'),
          style: 2,
          label: 'Acknowledge',
          custom_id: 'rng_act_0000000000000002',
        },
      };
      return sec;
    }
    case ComponentType.MEDIA_GALLERY: {
      const gallery: DiscordMediaGalleryComponent = {
        type: ComponentType.MEDIA_GALLERY,
        id: createComponentId('gal'),
        items: [
          {
            url: 'https://cdn.discordapp.com/embed/avatars/0.png',
            description: 'RNG Tactical Asset',
            spoiler: false,
          },
        ],
      };
      return gallery;
    }
    case ComponentType.SEPARATOR: {
      const sep: DiscordSeparatorComponent = {
        type: ComponentType.SEPARATOR,
        id: createComponentId('sep'),
        divider: true,
        spacing: 1,
      };
      return sep;
    }
    case ComponentType.TEXT_DISPLAY:
    default: {
      const txt: DiscordTextDisplayComponent = {
        type: ComponentType.TEXT_DISPLAY,
        id: createComponentId('txt'),
        content: 'Enter markdown-formatted message content...',
      };
      return txt;
    }
  }
}

function insertComponentIntoContainer(
  container: Type17Container,
  componentType: ComponentType,
  initialComponent?: DiscordInnerComponent
): Type17Container {
  if (container.components.length >= 40) {
    return container;
  }

  const newComp = initialComponent ?? createDefaultInnerComponent(componentType);

  if (newComp.type === ComponentType.BUTTON) {
    const componentsCopy = [...container.components];
    for (let i = componentsCopy.length - 1; i >= 0; i -= 1) {
      const existing = componentsCopy[i];
      if (existing.type === ComponentType.ACTION_ROW) {
        const allButtons = existing.components.every((c) => c.type === ComponentType.BUTTON);
        if (allButtons && existing.components.length < 5) {
          componentsCopy[i] = {
            ...existing,
            components: [...existing.components, newComp],
          };
          return {
            ...container,
            components: componentsCopy,
          };
        }
      }
    }

    const wrappedRow: DiscordActionRowComponent = {
      type: ComponentType.ACTION_ROW,
      id: createComponentId('row'),
      components: [newComp],
    };
    return {
      ...container,
      components: [...container.components, wrappedRow],
    };
  }

  if (newComp.type === ComponentType.STRING_SELECT) {
    const wrappedSelectRow: DiscordActionRowComponent = {
      type: ComponentType.ACTION_ROW,
      id: createComponentId('row'),
      components: [newComp],
    };
    return {
      ...container,
      components: [...container.components, wrappedSelectRow],
    };
  }

  return {
    ...container,
    components: [...container.components, newComp],
  };
}

function updateComponentInContainer(
  container: Type17Container,
  componentId: string,
  updates: Partial<DiscordInnerComponent>
): Type17Container {
  const updatedComponents = container.components.map((comp): DiscordInnerComponent => {
    if (comp.id === componentId) {
      return { ...comp, ...updates } as DiscordInnerComponent;
    }
    if (comp.type === ComponentType.ACTION_ROW) {
      const updatedChildren = comp.components.map((child) =>
        child.id === componentId ? ({ ...child, ...updates } as typeof child) : child
      );
      return {
        ...comp,
        components: updatedChildren,
      };
    }
    return comp;
  });

  return {
    ...container,
    components: updatedComponents,
  };
}

function removeComponentFromContainer(
  container: Type17Container,
  componentId: string
): Type17Container {
  const filtered: DiscordInnerComponent[] = [];
  for (const comp of container.components) {
    if (comp.id === componentId) {
      continue;
    }
    if (comp.type === ComponentType.ACTION_ROW) {
      const remainingChildren = comp.components.filter((c) => c.id !== componentId);
      if (remainingChildren.length > 0) {
        filtered.push({
          ...comp,
          components: remainingChildren,
        });
      }
    } else {
      filtered.push(comp);
    }
  }
  return {
    ...container,
    components: filtered,
  };
}

export function embedBuilderReducer(
  state: EmbedBuilderReducerState,
  action: EmbedBuilderAction
): EmbedBuilderReducerState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeSubTab: action.tab,
      };

    case 'SET_RAW_PAYLOAD_MODE':
      return {
        ...state,
        rawPayloadMode: action.mode,
      };

    case 'SET_MESSAGE_CONTENT':
      return {
        ...state,
        message: { ...state.message, content: action.content },
        isDirty: true,
      };

    case 'ADD_CONTAINER': {
      if (state.type17Containers.length >= 10) {
        return state;
      }
      return {
        ...state,
        type17Containers: [
          ...state.type17Containers,
          createDefaultContainer(action.container),
        ],
        isDirty: true,
      };
    }

    case 'UPDATE_CONTAINER':
      return {
        ...state,
        type17Containers: state.type17Containers.map((cnt) =>
          cnt.id === action.containerId ? { ...cnt, ...action.updates } : cnt
        ),
        isDirty: true,
      };

    case 'REMOVE_CONTAINER':
      return {
        ...state,
        type17Containers: state.type17Containers.filter(
          (cnt) => cnt.id !== action.containerId
        ),
        isDirty: true,
      };

    case 'MOVE_CONTAINER': {
      const containers = [...state.type17Containers];
      if (
        action.fromIndex < 0 ||
        action.fromIndex >= containers.length ||
        action.toIndex < 0 ||
        action.toIndex >= containers.length
      ) {
        return state;
      }
      const [moved] = containers.splice(action.fromIndex, 1);
      containers.splice(action.toIndex, 0, moved);
      return {
        ...state,
        type17Containers: containers,
        isDirty: true,
      };
    }

    case 'ADD_FIELD': {
      const containers = state.type17Containers.map((cnt, i) => {
        if (i !== action.containerIndex) return cnt;
        const fields = cnt.fields ? [...cnt.fields] : [];
        if (fields.length >= 25) return cnt;
        fields.push({
          id: createComponentId('fld'),
          name: 'New Field',
          value: 'Field Content',
          inline: false,
        });
        return { ...cnt, fields };
      });
      return {
        ...state,
        type17Containers: containers,
        isDirty: true,
      };
    }

    case 'UPDATE_FIELD': {
      const containers = state.type17Containers.map((cnt, i) => {
        if (i !== action.containerIndex) return cnt;
        const fields = cnt.fields ? [...cnt.fields] : [];
        if (action.fieldIndex < 0 || action.fieldIndex >= fields.length) return cnt;
        fields[action.fieldIndex] = {
          ...fields[action.fieldIndex],
          ...action.updates,
        };
        return { ...cnt, fields };
      });
      return {
        ...state,
        type17Containers: containers,
        isDirty: true,
      };
    }

    case 'REMOVE_FIELD': {
      const containers = state.type17Containers.map((cnt, i) => {
        if (i !== action.containerIndex) return cnt;
        const fields = cnt.fields
          ? cnt.fields.filter((_, fi) => fi !== action.fieldIndex)
          : [];
        return { ...cnt, fields };
      });
      return {
        ...state,
        type17Containers: containers,
        isDirty: true,
      };
    }

    case 'ADD_ACTION_ROW': {
      const targetIdx = action.containerIndex ?? 0;
      const containers = state.type17Containers.map((cnt, i) => {
        if (i !== targetIdx) return cnt;
        const row: DiscordActionRowComponent = {
          type: ComponentType.ACTION_ROW,
          id: createComponentId('row'),
          components: [
            {
              type: ComponentType.BUTTON,
              id: createComponentId('btn'),
              style: 1,
              label: 'Primary Button',
              custom_id: `rng_act_${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}`,
            },
          ],
        };
        return { ...cnt, components: [...cnt.components, row] };
      });
      return {
        ...state,
        type17Containers: containers,
        isDirty: true,
      };
    }

    case 'DUPLICATE_COMPONENT': {
      const containers = state.type17Containers.map((cnt, i) => {
        if (i !== action.containerIndex) return cnt;
        const items = [...cnt.components];
        if (action.componentIndex < 0 || action.componentIndex >= items.length) return cnt;
        const clone = JSON.parse(
          JSON.stringify(items[action.componentIndex])
        ) as DiscordInnerComponent;
        clone.id = createComponentId('dup');
        items.splice(action.componentIndex + 1, 0, clone);
        return { ...cnt, components: items };
      });
      return {
        ...state,
        type17Containers: containers,
        isDirty: true,
      };
    }

    case 'ADD_COMPONENT':
      return {
        ...state,
        type17Containers: state.type17Containers.map((cnt) =>
          cnt.id === action.containerId
            ? insertComponentIntoContainer(cnt, action.componentType, action.initialComponent)
            : cnt
        ),
        isDirty: true,
      };

    case 'UPDATE_COMPONENT':
      return {
        ...state,
        type17Containers: state.type17Containers.map((cnt) =>
          cnt.id === action.containerId
            ? updateComponentInContainer(cnt, action.componentId, action.updates)
            : cnt
        ),
        isDirty: true,
      };

    case 'REMOVE_COMPONENT':
      return {
        ...state,
        type17Containers: state.type17Containers.map((cnt) =>
          cnt.id === action.containerId
            ? removeComponentFromContainer(cnt, action.componentId)
            : cnt
        ),
        isDirty: true,
      };

    case 'REORDER_COMPONENTS': {
      return {
        ...state,
        type17Containers: state.type17Containers.map((cnt) => {
          if (cnt.id !== action.containerId) return cnt;
          const items = [...cnt.components];
          if (
            action.fromIndex < 0 ||
            action.fromIndex >= items.length ||
            action.toIndex < 0 ||
            action.toIndex >= items.length
          ) {
            return cnt;
          }
          const [moved] = items.splice(action.fromIndex, 1);
          items.splice(action.toIndex, 0, moved);
          return {
            ...cnt,
            components: items,
          };
        }),
        isDirty: true,
      };
    }

    case 'LOAD_TEMPLATE':
      return {
        ...state,
        message: action.state.message,
        type17Containers: action.state.type17Containers,
        activeTemplateId: action.templateId ?? null,
        activeTemplateName: action.templateName ?? state.activeTemplateName,
        isDirty: false,
      };

    case 'RESTORE_DRAFT':
      return {
        ...action.draft,
        isDirty: true,
      };

    case 'RESET_CANVAS':
      return createInitialEmbedBuilderState();

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        activeTemplateId:
          action.templateId !== undefined ? action.templateId : state.activeTemplateId,
        activeTemplateName:
          action.templateName !== undefined ? action.templateName : state.activeTemplateName,
      };

    default:
      return state;
  }
}

export function compileToDiscordV2Payload(
  state: Pick<MessageBuilderState, 'message' | 'type17Containers'>
): DiscordV2MessagePayload {
  const topLevelComponents: DiscordTopLevelComponent[] = [];

  if (state.message.content.trim().length > 0) {
    topLevelComponents.push({
      type: ComponentType.TEXT_DISPLAY,
      content: state.message.content.trim(),
    });
  }

  for (const container of state.type17Containers) {
    const childComponents: DiscordContainerChildComponent[] = [];

    if (container.title?.trim() || container.description?.trim()) {
      const headerLines: string[] = [];
      if (container.title?.trim()) {
        headerLines.push(`## ${container.title.trim()}`);
      }
      if (container.description?.trim()) {
        headerLines.push(container.description.trim());
      }
      childComponents.push({
        type: ComponentType.TEXT_DISPLAY,
        content: headerLines.join('\n'),
      });
    }

    for (const inner of container.components) {
      if (
        inner.type === ComponentType.TEXT_DISPLAY ||
        inner.type === ComponentType.ACTION_ROW ||
        inner.type === ComponentType.SECTION ||
        inner.type === ComponentType.MEDIA_GALLERY ||
        inner.type === ComponentType.SEPARATOR ||
        inner.type === ComponentType.FILE
      ) {
        childComponents.push(inner);
      } else if (inner.type === ComponentType.BUTTON || inner.type === ComponentType.STRING_SELECT) {
        childComponents.push({
          type: ComponentType.ACTION_ROW,
          components: [inner],
        });
      }
    }

    const containerPayload: DiscordV2ContainerPayload = {
      type: ComponentType.CONTAINER,
      accent_color: hexToInt(container.accentColor || '#E11D2E'),
      spoiler: Boolean(container.isSpoiler),
      components: childComponents,
    };

    topLevelComponents.push(containerPayload);
  }

  return {
    flags: 32768,
    components: topLevelComponents,
  };
}

export function parseDiscordPayloadToState(
  rawPayload: Record<string, unknown>
): Pick<MessageBuilderState, 'message' | 'type17Containers'> {
  const containers: Type17Container[] = [];
  let rootMessageContent = typeof rawPayload.content === 'string' ? rawPayload.content : '';

  const rawComponents = Array.isArray(rawPayload.components) ? rawPayload.components : [];
  rawComponents.forEach((rawComp, index) => {
    if (!rawComp || typeof rawComp !== 'object') return;
    const compRecord = rawComp as Record<string, unknown>;
    const compType = Number(compRecord.type);

    if (compType === ComponentType.TEXT_DISPLAY && index === 0 && !rootMessageContent) {
      rootMessageContent = typeof compRecord.content === 'string' ? compRecord.content : '';
      return;
    }

    if (compType === ComponentType.CONTAINER) {
      const accentInt =
        typeof compRecord.accent_color === 'number' ? compRecord.accent_color : 14753070;
      const rawChildren = Array.isArray(compRecord.components) ? compRecord.components : [];
      const parsedInner: DiscordInnerComponent[] = [];

      rawChildren.forEach((child, cIdx) => {
        if (!child || typeof child !== 'object') return;
        const childObj = child as Record<string, unknown>;
        const cType = Number(childObj.type);
        const childId =
          typeof childObj.id === 'string' ? childObj.id : `parsed_${index}_${cIdx}`;

        if (cType === ComponentType.TEXT_DISPLAY) {
          parsedInner.push({
            type: ComponentType.TEXT_DISPLAY,
            id: childId,
            content: typeof childObj.content === 'string' ? childObj.content : '',
          });
        } else if (cType === ComponentType.SEPARATOR) {
          parsedInner.push({
            type: ComponentType.SEPARATOR,
            id: childId,
            divider: childObj.divider !== false,
            spacing: childObj.spacing === 2 ? 2 : 1,
          });
        } else if (cType === ComponentType.ACTION_ROW) {
          const rowChildren = Array.isArray(childObj.components)
            ? (childObj.components as DiscordActionRowComponent['components'])
            : [];
          parsedInner.push({
            type: ComponentType.ACTION_ROW,
            id: childId,
            components: rowChildren.map((rc, rcIdx) => ({
              ...rc,
              id: rc.id || `parsed_rc_${index}_${cIdx}_${rcIdx}`,
            })),
          });
        } else if (cType === ComponentType.SECTION) {
          parsedInner.push({
            ...(childObj as unknown as DiscordSectionComponent),
            type: ComponentType.SECTION,
            id: childId,
          });
        } else if (cType === ComponentType.MEDIA_GALLERY) {
          parsedInner.push({
            type: ComponentType.MEDIA_GALLERY,
            id: childId,
            items: Array.isArray(childObj.items)
              ? (childObj.items as DiscordMediaGalleryComponent['items'])
              : [],
          });
        }
      });

      containers.push({
        id: typeof compRecord.id === 'string' ? compRecord.id : `cnt_parsed_${index}`,
        accentColor: intToHex(accentInt),
        isSpoiler: Boolean(compRecord.spoiler),
        title: '',
        description: '',
        components: parsedInner,
      });
    }
  });

  if (containers.length === 0) {
    containers.push(createDefaultContainer());
  }

  return {
    message: { content: rootMessageContent },
    type17Containers: containers,
  };
}

export function validateEmbedStateClientSide(
  state: Pick<MessageBuilderState, 'message' | 'type17Containers'>
): ClientValidationReport {
  const compiledPayload = compileToDiscordV2Payload(state);
  const violations: ClientValidationViolation[] = [];

  let totalComponents = compiledPayload.components.length;
  let totalActionRows = 0;
  let cumulativeCharacters = state.message.content.length;

  if (state.type17Containers.length > 10) {
    violations.push({
      code: 'MAX_CONTAINERS_EXCEEDED',
      message: `Maximum 10 Type 17 Containers allowed (current: ${state.type17Containers.length}).`,
      severity: 'ERROR',
    });
  }

  for (const container of state.type17Containers) {
    cumulativeCharacters += (container.title?.length ?? 0) + (container.description?.length ?? 0);
    if (container.components.length > 30) {
      violations.push({
        code: 'CONTAINER_DEPTH_EXCEEDED',
        message: `Container "${container.title || container.id}" exceeds 30 nested components.`,
        path: container.id,
        severity: 'ERROR',
      });
    }

    for (const comp of container.components) {
      totalComponents += 1;
      if (comp.type === ComponentType.TEXT_DISPLAY) {
        cumulativeCharacters += comp.content.length;
      } else if (comp.type === ComponentType.ACTION_ROW) {
        totalActionRows += 1;
        if (comp.components.length > 5) {
          violations.push({
            code: 'ACTION_ROW_OVERFLOW',
            message: 'Action Row cannot contain more than 5 interactive components.',
            path: comp.id,
            severity: 'ERROR',
          });
        }
        for (const child of comp.components) {
          totalComponents += 1;
          if (child.type === ComponentType.BUTTON) {
            cumulativeCharacters += child.label?.length ?? 0;
            if (child.style === 5) {
              if (!child.url || !DISCORD_SAFE_URL_REGEX.test(child.url)) {
                violations.push({
                  code: 'UNSAFE_BUTTON_URL',
                  message: `Link Button "${child.label || 'Untitled'}" requires a valid https:// or discord:// URL.`,
                  path: child.id,
                  severity: 'ERROR',
                });
              }
            } else if (!child.custom_id) {
              violations.push({
                code: 'MISSING_CUSTOM_ID',
                message: `Interactive Button "${child.label || 'Untitled'}" requires an action custom_id.`,
                path: child.id,
                severity: 'ERROR',
              });
            }
          } else if (child.type === ComponentType.STRING_SELECT) {
            cumulativeCharacters += child.placeholder?.length ?? 0;
          }
        }
      } else if (comp.type === ComponentType.SECTION) {
        for (const secTxt of comp.components) {
          cumulativeCharacters += secTxt.content.length;
        }
      }
    }
  }

  if (totalComponents > 40) {
    violations.push({
      code: 'MAX_COMPONENTS_EXCEEDED',
      message: `Total message-wide components (${totalComponents}) exceeds Discord V2 limit of 40.`,
      severity: 'ERROR',
    });
  }

  if (totalActionRows > 5) {
    violations.push({
      code: 'MAX_ACTION_ROWS_EXCEEDED',
      message: `Total Action Rows (${totalActionRows}) exceeds limit of 5 per message.`,
      severity: 'ERROR',
    });
  }

  if (cumulativeCharacters > 4000) {
    violations.push({
      code: 'CHARACTER_BUDGET_EXCEEDED',
      message: `Cumulative character count (${cumulativeCharacters}) exceeds 4,000 character budget.`,
      severity: 'ERROR',
    });
  }

  return {
    valid: violations.every((v) => v.severity !== 'ERROR'),
    violations,
    totalContainers: state.type17Containers.length,
    totalComponents,
    totalActionRows,
    cumulativeCharacters,
    compiledPayload,
  };
}

export function useEmbedBuilderReducer(initialOverride?: Partial<EmbedBuilderReducerState>) {
  const [state, dispatch] = useReducer(embedBuilderReducer, {
    ...createInitialEmbedBuilderState(),
    ...initialOverride,
  });

  const [pendingDraft, setPendingDraft] = useState<EmbedBuilderReducerState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(EMBED_DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as EmbedBuilderReducerState;
      if (parsed && Array.isArray(parsed.type17Containers)) {
        return parsed;
      }
    } catch {
      // Ignore malformed draft
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleSessionExpired = () => {
      if (state.isDirty) {
        try {
          sessionStorage.setItem(EMBED_DRAFT_STORAGE_KEY, JSON.stringify(state));
        } catch {
          // Storage quota exceeded or unavailable
        }
      }
    };

    window.addEventListener('rng:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('rng:session-expired', handleSessionExpired);
    };
  }, [state]);

  const restorePendingDraft = useCallback(() => {
    if (!pendingDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', draft: pendingDraft });
    setPendingDraft(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(EMBED_DRAFT_STORAGE_KEY);
    }
  }, [pendingDraft]);

  const discardPendingDraft = useCallback(() => {
    setPendingDraft(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(EMBED_DRAFT_STORAGE_KEY);
    }
  }, []);

  const validationReport = useMemo(
    () => validateEmbedStateClientSide(state),
    [state]
  );

  return {
    state,
    dispatch,
    validationReport,
    hasPendingDraft: pendingDraft !== null,
    restorePendingDraft,
    discardPendingDraft,
  };
}
