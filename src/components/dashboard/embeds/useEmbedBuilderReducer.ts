'use client';

import { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ComponentType,
  DISCORD_SAFE_URL_REGEX,
  type DiscordActionRowComponent,
  type DiscordActionRowChild,
  type DiscordButtonComponent,
  type DiscordContainerChildComponent,
  type DiscordFileComponent,
  type DiscordInnerComponent,
  type DiscordMediaGalleryComponent,
  type DiscordSectionComponent,
  type DiscordSeparatorComponent,
  type DiscordStringSelectComponent,
  type DiscordEntitySelectComponent,
  type DiscordSelectOption,
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
      type: 'MOVE_COMPONENT';
      containerIndex: number;
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
  | { type: 'SET_CONTAINERS'; containers: Type17Container[] }
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
    title: overrides?.title ?? '',
    description: overrides?.description ?? '',
    components: overrides?.components ?? [],
  };
}

export function createInitialEmbedBuilderState(): EmbedBuilderReducerState {
  return {
    activeSubTab: 'edit',
    rawPayloadMode: 'message',
    message: {
      content: '',
    },
    type17Containers: [],
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
    case ComponentType.USER_SELECT: {
      const select: DiscordEntitySelectComponent = {
        type: ComponentType.USER_SELECT,
        id: createComponentId('sel_user'),
        custom_id: `rng_sel_user_${Math.random().toString(16).slice(2, 10)}`,
        placeholder: 'Select a user...',
        min_values: 1,
        max_values: 1,
      };
      return select;
    }
    case ComponentType.ROLE_SELECT: {
      const select: DiscordEntitySelectComponent = {
        type: ComponentType.ROLE_SELECT,
        id: createComponentId('sel_role'),
        custom_id: `rng_sel_role_${Math.random().toString(16).slice(2, 10)}`,
        placeholder: 'Select a role...',
        min_values: 1,
        max_values: 1,
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
          type: ComponentType.THUMBNAIL,
          id: createComponentId('acc_thumb'),
          media: {
            url: 'https://cdn.discordapp.com/embed/avatars/0.png',
          },
          media_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
          description: 'Section Thumbnail',
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

  if (
    newComp.type === ComponentType.STRING_SELECT ||
    newComp.type === ComponentType.USER_SELECT ||
    newComp.type === ComponentType.ROLE_SELECT ||
    newComp.type === ComponentType.MENTIONABLE_SELECT ||
    newComp.type === ComponentType.CHANNEL_SELECT
  ) {
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

    case 'MOVE_COMPONENT': {
      const container = state.type17Containers[action.containerIndex];
      if (!container) return state;
      const comps = [...container.components];
      if (
        action.fromIndex < 0 ||
        action.fromIndex >= comps.length ||
        action.toIndex < 0 ||
        action.toIndex >= comps.length
      ) {
        return state;
      }
      const [moved] = comps.splice(action.fromIndex, 1);
      comps.splice(action.toIndex, 0, moved);
      return {
        ...state,
        type17Containers: state.type17Containers.map((c, i) =>
          i === action.containerIndex ? { ...c, components: comps } : c
        ),
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

    case 'SET_CONTAINERS':
      return {
        ...state,
        type17Containers: action.containers,
        isDirty: true,
      };

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

    // 1. Author, Title, Description Header
    const hasHeaderContent = Boolean(
      container.author?.name?.trim() ||
      container.title?.trim() ||
      container.description?.trim()
    );

    if (hasHeaderContent) {
      const headerLines: string[] = [];
      if (container.author?.name?.trim()) {
        headerLines.push(`__**${container.author.name.trim()}**__`);
      }
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

    // 2. Process Inner Components with Strict Discord V2 Rules & ID Sanitization
    let pendingButtons: DiscordButtonComponent[] = [];

    const flushPendingButtons = () => {
      if (pendingButtons.length === 0) return;
      childComponents.push({
        type: ComponentType.ACTION_ROW,
        components: pendingButtons.map(sanitizeButton),
      });
      pendingButtons = [];
    };

    function sanitizeButton(btn: DiscordButtonComponent): DiscordButtonComponent {
      const isLink = btn.style === 5;
      return {
        type: ComponentType.BUTTON,
        style: btn.style || 1,
        ...(btn.label?.trim() ? { label: btn.label.trim() } : {}),
        ...(btn.emoji ? { emoji: btn.emoji } : {}),
        ...(isLink
          ? { url: btn.url?.trim() || 'https://rng.gg' }
          : { custom_id: btn.custom_id?.trim() || `btn_${Date.now()}` }),
        ...(btn.disabled ? { disabled: true } : {}),
      };
    }

    function sanitizeSelectMenu(menu: DiscordInnerComponent): DiscordActionRowChild {
      const t = menu.type;
      const base = {
        type: t,
        custom_id: (menu as any).custom_id?.trim() || `sel_${Date.now()}`,
        ...((menu as any).placeholder?.trim() ? { placeholder: (menu as any).placeholder.trim() } : {}),
        ...((menu as any).min_values !== undefined ? { min_values: (menu as any).min_values } : {}),
        ...((menu as any).max_values !== undefined ? { max_values: (menu as any).max_values } : {}),
        ...((menu as any).disabled ? { disabled: true } : {}),
      };

      if (t === ComponentType.STRING_SELECT) {
        const rawOpts = Array.isArray((menu as any).options) ? (menu as any).options : [];
        const sanitizedOpts = rawOpts.map((opt: any, idx: number) => ({
          label: String(opt.label || `Option ${idx + 1}`).trim(),
          value: String(opt.value || `opt_${idx + 1}`).trim(),
          ...(opt.description?.trim() ? { description: opt.description.trim() } : {}),
          ...(opt.emoji ? { emoji: opt.emoji } : {}),
          ...(opt.default ? { default: true } : {}),
        }));
        return {
          ...base,
          type: ComponentType.STRING_SELECT,
          options: sanitizedOpts.length > 0 ? sanitizedOpts : [{ label: 'Option 1', value: 'opt_1' }],
        };
      }

      return base as DiscordActionRowChild;
    }

    for (const inner of container.components) {
      if (inner.type === ComponentType.BUTTON) {
        pendingButtons.push(inner as DiscordButtonComponent);
        if (pendingButtons.length === 5) {
          flushPendingButtons();
        }
        continue;
      }

      // Any non-button flushes pending buttons
      flushPendingButtons();

      if (
        inner.type === ComponentType.STRING_SELECT ||
        inner.type === ComponentType.USER_SELECT ||
        inner.type === ComponentType.ROLE_SELECT ||
        inner.type === ComponentType.MENTIONABLE_SELECT ||
        inner.type === ComponentType.CHANNEL_SELECT
      ) {
        childComponents.push({
          type: ComponentType.ACTION_ROW,
          components: [sanitizeSelectMenu(inner)],
        });
      } else if (inner.type === ComponentType.ACTION_ROW) {
        const rawChildren = Array.isArray((inner as DiscordActionRowComponent).components)
          ? (inner as DiscordActionRowComponent).components
          : [];
        const buttons = rawChildren.filter((c) => c.type === ComponentType.BUTTON) as DiscordButtonComponent[];
        const selects = rawChildren.filter((c) => c.type !== ComponentType.BUTTON);

        if (selects.length > 0) {
          selects.forEach((sel) => {
            childComponents.push({
              type: ComponentType.ACTION_ROW,
              components: [sanitizeSelectMenu(sel)],
            });
          });
        }
        if (buttons.length > 0) {
          for (let i = 0; i < buttons.length; i += 5) {
            childComponents.push({
              type: ComponentType.ACTION_ROW,
              components: buttons.slice(i, i + 5).map(sanitizeButton),
            });
          }
        }
      } else if (inner.type === ComponentType.SECTION) {
        const sec = inner as DiscordSectionComponent;
        const textComponents: DiscordTextDisplayComponent[] = [];
        if (Array.isArray(sec.components) && sec.components.length > 0) {
          const firstTxt = sec.components[0];
          textComponents.push({
            type: ComponentType.TEXT_DISPLAY,
            content: firstTxt?.content || '**Section Header**',
          });
        } else {
          textComponents.push({
            type: ComponentType.TEXT_DISPLAY,
            content: sec.text || '**Section Header**',
          });
        }

        let sanitizedAccessory: any = undefined;
        if (sec.accessory) {
          const acc = sec.accessory as any;
          if (acc.type === ComponentType.THUMBNAIL || acc.type === 'thumbnail' || acc.media || acc.media_url || acc.url) {
            const rawUrl = acc.media?.url || acc.media_url || acc.url || 'https://cdn.discordapp.com/embed/avatars/0.png';
            sanitizedAccessory = {
              type: ComponentType.THUMBNAIL,
              media: { url: rawUrl },
              ...(acc.description?.trim() ? { description: acc.description.trim() } : {}),
              ...(acc.spoiler ? { spoiler: true } : {}),
            };
          } else if (acc.type === ComponentType.BUTTON || acc.type === 'button') {
            sanitizedAccessory = sanitizeButton(acc);
          }
        }

        childComponents.push({
          type: ComponentType.SECTION,
          components: textComponents,
          ...(sanitizedAccessory ? { accessory: sanitizedAccessory } : {}),
        });
      } else if (inner.type === ComponentType.MEDIA_GALLERY) {
        const gal = inner as DiscordMediaGalleryComponent;
        const rawItems = Array.isArray(gal.items) ? gal.items : [];
        const sanitizedItems = rawItems.slice(0, 4).map((item: any) => {
          const url = typeof item === 'string' ? item : item.media?.url || item.url || '';
          return {
            media: { url },
            ...(item.description?.trim() ? { description: item.description.trim() } : {}),
            ...(item.spoiler ? { spoiler: true } : {}),
          };
        }).filter((it) => Boolean(it.media.url));

        if (sanitizedItems.length > 0) {
          childComponents.push({
            type: ComponentType.MEDIA_GALLERY,
            items: sanitizedItems,
          });
        }
      } else if (inner.type === ComponentType.SEPARATOR) {
        const sep = inner as DiscordSeparatorComponent;
        childComponents.push({
          type: ComponentType.SEPARATOR,
          divider: sep.divider !== false,
          spacing: sep.spacing === 2 ? 2 : 1,
        });
      } else if (inner.type === ComponentType.TEXT_DISPLAY) {
        const txt = inner as DiscordTextDisplayComponent;
        childComponents.push({
          type: ComponentType.TEXT_DISPLAY,
          content: txt.content || '',
        });
      } else if (inner.type === ComponentType.FILE) {
        const f = inner as DiscordFileComponent;
        const fileUrl = f.file?.url || f.url || '';
        childComponents.push({
          type: ComponentType.FILE,
          file: { url: fileUrl },
        });
      }
    }

    // Flush any trailing buttons
    flushPendingButtons();

    // 3. Trailing Footer
    if (container.footer?.text?.trim()) {
      childComponents.push({
        type: ComponentType.TEXT_DISPLAY,
        content: `-# ${container.footer.text.trim()}`,
      });
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

      let containerTitle = typeof compRecord.title === 'string' ? compRecord.title : '';
      let containerDesc = typeof compRecord.description === 'string' ? compRecord.description : '';
      const authorObj =
        compRecord.author && typeof compRecord.author === 'object'
          ? (compRecord.author as Record<string, unknown>)
          : undefined;
      const footerObj =
        compRecord.footer && typeof compRecord.footer === 'object'
          ? (compRecord.footer as Record<string, unknown>)
          : undefined;

      let containerAuthor: { name: string; icon_url?: string } | undefined =
        authorObj && typeof authorObj.name === 'string' && Boolean(authorObj.name.trim())
          ? {
              name: authorObj.name.trim(),
              icon_url: typeof authorObj.icon_url === 'string' ? authorObj.icon_url : undefined,
            }
          : undefined;

      let containerFooter: { text: string; icon_url?: string } | undefined =
        footerObj && typeof footerObj.text === 'string' && Boolean(footerObj.text.trim())
          ? {
              text: footerObj.text.trim(),
              icon_url: typeof footerObj.icon_url === 'string' ? footerObj.icon_url : undefined,
            }
          : undefined;
      const containerFields = Array.isArray(compRecord.fields)
        ? (compRecord.fields as { name: string; value: string; inline?: boolean }[])
        : [];

      rawChildren.forEach((child, cIdx) => {
        if (!child || typeof child !== 'object') return;
        const childObj = child as Record<string, unknown>;
        const cType = Number(childObj.type);
        const childId =
          typeof childObj.id === 'string' ? childObj.id : `parsed_${index}_${cIdx}`;

        if (cType === ComponentType.TEXT_DISPLAY) {
          const rawContent = typeof childObj.content === 'string' ? childObj.content : '';
          if (rawContent.startsWith('-# ') && !containerFooter?.text) {
            containerFooter = { text: rawContent.replace(/^-#\s*/, '').trim(), icon_url: '' };
          } else if (!containerTitle && !containerDesc && !rawContent.startsWith('-# ') && cIdx === 0) {
            const lines = rawContent.split('\n');
            let lineIdx = 0;
            if (lines[lineIdx] && lines[lineIdx].startsWith('__**') && lines[lineIdx].endsWith('**__')) {
              containerAuthor = { name: lines[lineIdx].slice(4, -4).trim(), icon_url: '' };
              lineIdx++;
            }
            if (lines[lineIdx] && lines[lineIdx].startsWith('## ')) {
              containerTitle = lines[lineIdx].slice(3).trim();
              lineIdx++;
            } else if (lines[lineIdx] && lines[lineIdx].startsWith('**') && lines[lineIdx].endsWith('**')) {
              containerTitle = lines[lineIdx].slice(2, -2).trim();
              lineIdx++;
            }
            containerDesc = lines.slice(lineIdx).join('\n');
          } else {
            parsedInner.push({
              type: ComponentType.TEXT_DISPLAY,
              id: childId,
              content: rawContent,
            });
          }
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
        } else if (cType === ComponentType.STRING_SELECT) {
          parsedInner.push({
            type: ComponentType.STRING_SELECT,
            id: childId,
            custom_id:
              typeof childObj.custom_id === 'string'
                ? childObj.custom_id
                : `rng_act_${childId}`,
            placeholder:
              typeof childObj.placeholder === 'string'
                ? childObj.placeholder
                : undefined,
            disabled: Boolean(childObj.disabled),
            options: Array.isArray(childObj.options)
              ? (childObj.options as DiscordStringSelectComponent['options'])
              : [],
            invokerButtonId:
              typeof childObj.invokerButtonId === 'string'
                ? childObj.invokerButtonId
                : undefined,
          });
        } else if (
          cType === ComponentType.USER_SELECT ||
          cType === ComponentType.ROLE_SELECT ||
          cType === ComponentType.MENTIONABLE_SELECT ||
          cType === ComponentType.CHANNEL_SELECT
        ) {
          parsedInner.push({
            type: cType as
              | ComponentType.USER_SELECT
              | ComponentType.ROLE_SELECT
              | ComponentType.MENTIONABLE_SELECT
              | ComponentType.CHANNEL_SELECT,
            id: childId,
            custom_id:
              typeof childObj.custom_id === 'string'
                ? childObj.custom_id
                : `rng_act_${childId}`,
            placeholder:
              typeof childObj.placeholder === 'string'
                ? childObj.placeholder
                : undefined,
            disabled: Boolean(childObj.disabled),
            options: Array.isArray(childObj.options)
              ? (childObj.options as DiscordEntitySelectComponent['options'])
              : undefined,
            channel_types: Array.isArray(childObj.channel_types)
              ? (childObj.channel_types as number[])
              : undefined,
            default_values: Array.isArray(childObj.default_values)
              ? (childObj.default_values as DiscordEntitySelectComponent['default_values'])
              : undefined,
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
        author: containerAuthor,
        title: containerTitle,
        description: containerDesc,
        fields: containerFields,
        footer: containerFooter,
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
    if (container.author?.name) cumulativeCharacters += container.author.name.length;
    if (container.footer?.text) cumulativeCharacters += container.footer.text.length;

    if (Array.isArray(container.fields)) {
      if (container.fields.length > 25) {
        violations.push({
          code: 'CONTAINER_FIELDS_EXCEEDED',
          message: `Container "${container.title || container.id}" contains ${container.fields.length} fields (maximum 25 allowed).`,
          path: container.id,
          severity: 'ERROR',
        });
      }
      for (const f of container.fields) {
        if (f.name) cumulativeCharacters += f.name.length;
        if (f.value) cumulativeCharacters += f.value.length;
      }
    }

    if (container.components.length > 30) {
      violations.push({
        code: 'CONTAINER_DEPTH_EXCEEDED',
        message: `Container "${container.title || container.id}" exceeds 30 nested components.`,
        path: container.id,
        severity: 'ERROR',
      });
    }

    let containerActionRows = 0;
    for (const comp of container.components) {
      totalComponents += 1;
      if (comp.type === ComponentType.TEXT_DISPLAY) {
        cumulativeCharacters += comp.content.length;
      } else if (comp.type === ComponentType.ACTION_ROW) {
        containerActionRows += 1;
        totalActionRows += 1;
        const rowButtons = comp.components.filter((c) => c.type === ComponentType.BUTTON);
        const rowSelects = comp.components.filter(
          (c) =>
            c.type === ComponentType.STRING_SELECT ||
            c.type === ComponentType.USER_SELECT ||
            c.type === ComponentType.ROLE_SELECT ||
            c.type === ComponentType.MENTIONABLE_SELECT ||
            c.type === ComponentType.CHANNEL_SELECT
        );

        if (comp.components.length > 5) {
          violations.push({
            code: 'ACTION_ROW_OVERFLOW',
            message: 'Action Row cannot contain more than 5 interactive components.',
            path: comp.id,
            severity: 'ERROR',
          });
        }
        if (rowSelects.length > 1) {
          violations.push({
            code: 'ACTION_ROW_SELECT_OVERFLOW',
            message: 'Action Row can contain at most 1 Select Menu.',
            path: comp.id,
            severity: 'ERROR',
          });
        }
        if (rowSelects.length > 0 && rowButtons.length > 0) {
          violations.push({
            code: 'ROW_SELECT_AND_BUTTON_MIX',
            message: 'Action Row cannot mix Buttons and Select Menus.',
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
            } else if (!child.custom_id || child.custom_id.trim().length === 0) {
              violations.push({
                code: 'MISSING_CUSTOM_ID',
                message: `Interactive Button "${child.label || 'Untitled'}" requires an action custom_id.`,
                path: child.id,
                severity: 'ERROR',
              });
            } else if (child.custom_id.length > 100) {
              violations.push({
                code: 'INVALID_BUTTON_CUSTOM_ID',
                message: `Button custom_id cannot exceed 100 characters.`,
                path: child.id,
                severity: 'ERROR',
              });
            }
          } else if (child.type === ComponentType.STRING_SELECT) {
            cumulativeCharacters += child.placeholder?.length ?? 0;
            if (child.placeholder && child.placeholder.length > 150) {
              violations.push({
                code: 'SELECT_PLACEHOLDER_LENGTH_EXCEEDED',
                message: 'Select menu placeholder cannot exceed 150 characters.',
                path: child.id,
                severity: 'ERROR',
              });
            }
            if (child.options) {
              if (child.options.length === 0) {
                violations.push({
                  code: 'SELECT_OPTIONS_EMPTY',
                  message: 'String Select menu must have at least 1 option.',
                  path: child.id,
                  severity: 'ERROR',
                });
              } else if (child.options.length > 25) {
                violations.push({
                  code: 'SELECT_OPTIONS_LIMIT_EXCEEDED',
                  message: `String Select menu has ${child.options.length} options (maximum 25 allowed).`,
                  path: child.id,
                  severity: 'ERROR',
                });
              }
              for (const opt of child.options) {
                if (opt.label) cumulativeCharacters += opt.label.length;
                if (opt.description) cumulativeCharacters += opt.description.length;
                if (!opt.label || opt.label.trim().length === 0) {
                  violations.push({
                    code: 'SELECT_OPTION_LABEL_EMPTY',
                    message: 'Select option label cannot be empty.',
                    path: child.id,
                    severity: 'ERROR',
                  });
                } else if (opt.label.length > 100) {
                  violations.push({
                    code: 'SELECT_OPTION_LABEL_LENGTH',
                    message: `Select option label exceeds 100 characters.`,
                    path: child.id,
                    severity: 'ERROR',
                  });
                }
                if (!opt.value || opt.value.trim().length === 0) {
                  violations.push({
                    code: 'SELECT_OPTION_VALUE_EMPTY',
                    message: `Select option "${opt.label || 'Untitled'}" must have a value.`,
                    path: child.id,
                    severity: 'ERROR',
                  });
                } else if (opt.value.length > 100) {
                  violations.push({
                    code: 'SELECT_OPTION_VALUE_LENGTH',
                    message: 'Select option value exceeds 100 characters.',
                    path: child.id,
                    severity: 'ERROR',
                  });
                }
              }
            }
          }
        }
      } else if (comp.type === ComponentType.SECTION) {
        for (const secTxt of comp.components) {
          cumulativeCharacters += secTxt.content.length;
        }
        if (comp.accessory && 'type' in comp.accessory && comp.accessory.type === ComponentType.BUTTON) {
          const btnAcc = comp.accessory as DiscordButtonComponent;
          if (btnAcc.label) cumulativeCharacters += btnAcc.label.length;
          if (btnAcc.style === 5) {
            if (!btnAcc.url || !DISCORD_SAFE_URL_REGEX.test(btnAcc.url)) {
              violations.push({
                code: 'UNSAFE_SECTION_ACCESSORY_URL',
                message: 'Section accessory Link Button requires a valid https:// or discord:// URL.',
                path: comp.id,
                severity: 'ERROR',
              });
            }
          } else if (!btnAcc.custom_id || btnAcc.custom_id.length > 100) {
            violations.push({
              code: 'INVALID_SECTION_ACCESSORY_CUSTOM_ID',
              message: 'Section accessory interactive Button must have a custom_id (1-100 characters).',
              path: comp.id,
              severity: 'ERROR',
            });
          }
        }
      } else if (comp.type === ComponentType.MEDIA_GALLERY) {
        if (comp.items.length === 0) {
          violations.push({
            code: 'MEDIA_GALLERY_EMPTY',
            message: 'Media Gallery must contain at least 1 image.',
            path: comp.id,
            severity: 'ERROR',
          });
        } else if (comp.items.length > 4) {
          violations.push({
            code: 'MEDIA_GALLERY_LIMIT',
            message: `Media Gallery has ${comp.items.length} images (maximum 4 allowed).`,
            path: comp.id,
            severity: 'ERROR',
          });
        }
      }
    }

    if (containerActionRows > 5) {
      violations.push({
        code: 'CONTAINER_ACTION_ROWS_EXCEEDED',
        message: `Container "${container.title || container.id}" contains ${containerActionRows} Action Rows (maximum 5 allowed).`,
        path: container.id,
        severity: 'ERROR',
      });
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
