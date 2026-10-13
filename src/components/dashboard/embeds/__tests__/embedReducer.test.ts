import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComponentType,
  type DiscordButtonComponent,
  type DiscordActionRowComponent,
  type DiscordTextDisplayComponent,
} from '@/lib/model/embed';
import {
  embedBuilderReducer,
  createInitialEmbedBuilderState,
  compileToDiscordV2Payload,
  parseDiscordPayloadToState,
  validateEmbedStateClientSide,
  EMBED_DRAFT_STORAGE_KEY,
} from '../useEmbedBuilderReducer';

describe('useEmbedBuilderReducer & Discord V2 Compiler', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('initializes with default single Type 17 container and isDirty=false', () => {
    const state = createInitialEmbedBuilderState();
    expect(state.type17Containers.length).toBe(1);
    expect(state.isDirty).toBe(false);
    expect(state.activeSubTab).toBe('edit');
    expect(state.type17Containers[0].accentColor).toBe('#E11D2E');
  });

  it('adds containers up to max 10 and marks state as dirty', () => {
    let state = createInitialEmbedBuilderState();
    for (let i = 0; i < 9; i += 1) {
      state = embedBuilderReducer(state, { type: 'ADD_CONTAINER' });
    }
    expect(state.type17Containers.length).toBe(10);
    expect(state.isDirty).toBe(true);

    // 11th container must be rejected by invariant
    const overflowState = embedBuilderReducer(state, { type: 'ADD_CONTAINER' });
    expect(overflowState.type17Containers.length).toBe(10);
  });

  it('updates container accent color and properties', () => {
    let state = createInitialEmbedBuilderState();
    const containerId = state.type17Containers[0].id;
    state = embedBuilderReducer(state, {
      type: 'UPDATE_CONTAINER',
      containerId,
      updates: { accentColor: '#5865F2', isSpoiler: true, title: 'Updated Title' },
    });

    expect(state.type17Containers[0].accentColor).toBe('#5865F2');
    expect(state.type17Containers[0].isSpoiler).toBe(true);
    expect(state.type17Containers[0].title).toBe('Updated Title');
    expect(state.isDirty).toBe(true);
  });

  it('enforces smart button insertion into existing Action Row with < 5 buttons', () => {
    let state = createInitialEmbedBuilderState();
    const containerId = state.type17Containers[0].id;

    // First button creates an Action Row
    state = embedBuilderReducer(state, {
      type: 'ADD_COMPONENT',
      containerId,
      componentType: ComponentType.BUTTON,
    });

    const rows = state.type17Containers[0].components.filter(
      (c): c is DiscordActionRowComponent => c.type === ComponentType.ACTION_ROW
    );
    expect(rows.length).toBe(1);
    expect(rows[0].components.length).toBe(1);

    // Second button must pack into the same Action Row
    state = embedBuilderReducer(state, {
      type: 'ADD_COMPONENT',
      containerId,
      componentType: ComponentType.BUTTON,
    });

    const updatedRows = state.type17Containers[0].components.filter(
      (c): c is DiscordActionRowComponent => c.type === ComponentType.ACTION_ROW
    );
    expect(updatedRows.length).toBe(1);
    expect(updatedRows[0].components.length).toBe(2);

    // Add 3 more buttons to fill row to 5
    for (let i = 0; i < 3; i += 1) {
      state = embedBuilderReducer(state, {
        type: 'ADD_COMPONENT',
        containerId,
        componentType: ComponentType.BUTTON,
      });
    }
    expect(state.type17Containers[0].components.filter((c) => c.type === ComponentType.ACTION_ROW)[0].components.length).toBe(5);

    // 6th button must overflow into a new Action Row
    state = embedBuilderReducer(state, {
      type: 'ADD_COMPONENT',
      containerId,
      componentType: ComponentType.BUTTON,
    });
    const finalRows = state.type17Containers[0].components.filter(
      (c): c is DiscordActionRowComponent => c.type === ComponentType.ACTION_ROW
    );
    expect(finalRows.length).toBe(2);
    expect(finalRows[1].components.length).toBe(1);
  });

  it('updates and removes components correctly', () => {
    let state = createInitialEmbedBuilderState();
    const containerId = state.type17Containers[0].id;

    state = embedBuilderReducer(state, {
      type: 'ADD_COMPONENT',
      containerId,
      componentType: ComponentType.BUTTON,
    });

    const row = state.type17Containers[0].components.find(
      (c): c is DiscordActionRowComponent => c.type === ComponentType.ACTION_ROW
    )!;
    const btnId = row.components[0].id!;

    state = embedBuilderReducer(state, {
      type: 'UPDATE_COMPONENT',
      containerId,
      componentId: btnId,
      updates: { label: 'Updated Action Label' },
    });

    const updatedRow = state.type17Containers[0].components.find(
      (c): c is DiscordActionRowComponent => c.type === ComponentType.ACTION_ROW
    )!;
    expect((updatedRow.components[0] as DiscordButtonComponent).label).toBe(
      'Updated Action Label'
    );

    // Remove the button
    state = embedBuilderReducer(state, {
      type: 'REMOVE_COMPONENT',
      containerId,
      componentId: btnId,
    });

    const emptyRows = state.type17Containers[0].components.filter(
      (c) => c.type === ComponentType.ACTION_ROW
    );
    expect(emptyRows.length).toBe(0);
  });

  it('reorders components within container bounds', () => {
    let state = createInitialEmbedBuilderState();
    const containerId = state.type17Containers[0].id;

    state = embedBuilderReducer(state, {
      type: 'ADD_COMPONENT',
      containerId,
      componentType: ComponentType.SEPARATOR,
    });

    const initialFirstId = state.type17Containers[0].components[0].id;
    state = embedBuilderReducer(state, {
      type: 'REORDER_COMPONENTS',
      containerId,
      fromIndex: 0,
      toIndex: 1,
    });

    expect(state.type17Containers[0].components[1].id).toBe(initialFirstId);
  });

  it('compiles state into valid Discord V2 payload (flags: 32768, 24-bit bounded accent color)', () => {
    const state = createInitialEmbedBuilderState();
    state.message.content = 'Role Ping Alert';
    state.type17Containers[0].accentColor = '#5865F2';

    const compiled = compileToDiscordV2Payload(state);
    expect(compiled.flags).toBe(32768);
    // Leading content wrapped as top-level text display
    expect(compiled.components[0].type).toBe(ComponentType.TEXT_DISPLAY);
    expect((compiled.components[0] as { content: string }).content).toBe('Role Ping Alert');

    // Container payload with converted integer color
    const containerPayload = compiled.components[1];
    expect(containerPayload.type).toBe(ComponentType.CONTAINER);
    expect((containerPayload as { accent_color: number }).accent_color).toBe(5793266);
  });

  it('bi-directionally parses Discord V2 payload back into state', () => {
    const rawPayload = {
      flags: 32768,
      content: 'Header Message',
      components: [
        {
          type: ComponentType.CONTAINER,
          accent_color: 14753070,
          spoiler: true,
          components: [
            {
              type: ComponentType.TEXT_DISPLAY,
              id: 'txt_parsed_1',
              content: 'Parsed Markdown',
            },
          ],
        },
      ],
    };

    const parsed = parseDiscordPayloadToState(rawPayload);
    expect(parsed.message.content).toBe('Header Message');
    expect(parsed.type17Containers.length).toBe(1);
    expect(parsed.type17Containers[0].accentColor).toBe('#E11D2E');
    expect(parsed.type17Containers[0].isSpoiler).toBe(true);
    const firstComp = parsed.type17Containers[0].components[0] as DiscordTextDisplayComponent;
    expect(firstComp.content).toBe('Parsed Markdown');
  });

  it('validates Discord V2 client-side limits and reports violations', () => {
    const state = createInitialEmbedBuilderState();

    // Add invalid Style 5 button without valid URL
    const invalidBtn: DiscordButtonComponent = {
      type: ComponentType.BUTTON,
      id: 'btn_invalid_link',
      style: 5,
      label: 'Dangerous Link',
      url: 'javascript:alert(1)',
    };

    const row: DiscordActionRowComponent = {
      type: ComponentType.ACTION_ROW,
      id: 'row_1',
      components: [invalidBtn],
    };

    state.type17Containers[0].components = [row];

    const report = validateEmbedStateClientSide(state);
    expect(report.valid).toBe(false);
    expect(report.violations.some((v) => v.code === 'UNSAFE_BUTTON_URL')).toBe(true);
  });

  it('serializes and deserializes draft to sessionStorage on session expiry (SEC-201)', () => {
    const state = createInitialEmbedBuilderState();
    state.isDirty = true;
    state.message.content = 'Auto-saved draft message';

    sessionStorage.setItem(EMBED_DRAFT_STORAGE_KEY, JSON.stringify(state));
    const saved = JSON.parse(sessionStorage.getItem(EMBED_DRAFT_STORAGE_KEY)!);

    expect(saved.message.content).toBe('Auto-saved draft message');
    expect(saved.isDirty).toBe(true);
  });
});
