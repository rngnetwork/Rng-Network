import {
  Type17Container,
  DiscordV2MessagePayload,
  DiscordModalPayload,
  DiscordV2ValidationResult,
  PartialEmojiObject,
  DiscordInnerComponent
} from './types';

/**
 * Serializes raw emoji string or partial emoji object into compliant Discord API format.
 */
export function serializeEmoji(emoji: unknown): PartialEmojiObject | null {
  if (!emoji) return null;
  if (typeof emoji === 'object' && emoji !== null && 'name' in emoji) {
    const obj = emoji as { name: string; id?: string; animated?: boolean };
    return {
      name: obj.name,
      id: obj.id || undefined,
      animated: Boolean(obj.animated)
    };
  }
  if (typeof emoji === 'string') {
    const trimmed = emoji.trim();
    if (!trimmed) return null;

    // Discord custom emoji syntax: <:name:id> or <a:name:id>
    const customMatch = trimmed.match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/);
    if (customMatch) {
      return {
        animated: Boolean(customMatch[1]),
        name: customMatch[2],
        id: customMatch[3]
      };
    }
    // Standard Unicode emoji
    return { name: trimmed };
  }
  return null;
}

/**
 * Serializes a Button (Type 2) to Discord API specification.
 */
export function serializeButtonComponent(btn: Record<string, unknown>): Record<string, unknown> | null {
  if (!btn) return null;
  const rawStyle = typeof btn.style === 'number' ? btn.style : parseInt(String(btn.style || 1), 10);
  const style = !isNaN(rawStyle) && rawStyle >= 1 && rawStyle <= 5 ? rawStyle : 1;

  const serialized: Record<string, unknown> = {
    type: 2,
    style: style,
    label: (btn.label as string) || (style === 5 ? 'Open Link' : 'Button')
  };

  const emojiObj = serializeEmoji(btn.emoji);
  if (emojiObj) serialized.emoji = emojiObj;
  if (btn.disabled) serialized.disabled = true;

  if (style === 5) {
    serialized.url = (btn.url as string) || 'https://rng.gg';
  } else {
    serialized.custom_id = (btn.custom_id as string) || `btn_${Math.random().toString(36).substring(2, 8)}`;
  }

  return serialized;
}

/**
 * Serializes a Select Menu (Types 3, 5, 6, 7, 8) to Discord API specification.
 */
export function serializeSelectComponent(comp: Record<string, unknown>): Record<string, unknown> | null {
  if (!comp) return null;
  const type = parseInt(String(comp.type || 3), 10) || 3;
  const serialized: Record<string, unknown> = {
    type: type,
    custom_id: (comp.custom_id as string) || (comp.id as string) || `sel_${Math.random().toString(36).substring(2, 8)}`,
    placeholder: (comp.placeholder as string) || 'Select an option...'
  };

  if (type === 3 && Array.isArray(comp.options)) {
    serialized.options = comp.options.map((opt: unknown) => {
      const optRecord = (opt && typeof opt === 'object' ? opt : {}) as Record<string, unknown>;
      const optObj: Record<string, unknown> = {
        label: (optRecord.label as string) || 'Option',
        value: (optRecord.value as string) || `opt_${Math.random().toString(36).substring(2, 6)}`
      };
      const emojiObj = serializeEmoji(optRecord.emoji);
      if (emojiObj) optObj.emoji = emojiObj;
      if (optRecord.description) optObj.description = optRecord.description;
      optObj.default = Boolean(optRecord.default || optRecord.selected);
      return optObj;
    });
  }

  if (type === 8 && comp.channel_types) {
    serialized.channel_types = comp.channel_types;
  }
  if (comp.min_values !== undefined) serialized.min_values = comp.min_values;
  if (comp.max_values !== undefined) serialized.max_values = comp.max_values;
  if (comp.disabled) serialized.disabled = true;

  return serialized;
}

/**
 * Serializes any inner component for Discord Components V2 message payload.
 */
export function serializeMessageComponent(comp: Record<string, unknown>): Record<string, unknown> | null {
  if (!comp) return null;
  const t = parseInt(String(comp.type || 0), 10);

  switch (t) {
    case 1: { // Action Row
      const rawChildren = (comp.items || comp.components || []) as Record<string, unknown>[];
      const children = rawChildren
        .map((child) => {
          if (child.type === 2) return serializeButtonComponent(child);
          if (typeof child.type === 'number' && [3, 5, 6, 7, 8].includes(child.type)) {
            return serializeSelectComponent(child);
          }
          return serializeButtonComponent(child);
        })
        .filter(Boolean)
        .slice(0, 5);

      return {
        type: 1,
        components: children
      };
    }

    // Select Menus must be wrapped in Type 1 Action Row for message payloads
    case 3:
    case 5:
    case 6:
    case 7:
    case 8: {
      return {
        type: 1,
        components: [serializeSelectComponent(comp)]
      };
    }

    case 9: { // Section (requires accessory)
      const compList = comp.components as Record<string, unknown>[] | undefined;
      const secText = (comp.text as string) || (compList && (compList[0]?.content as string)) || '';
      let accessory: Record<string, unknown> | null = null;
      const acc = comp.accessory as Record<string, unknown> | undefined;

      if (acc) {
        const accMedia = acc.media as Record<string, unknown> | undefined;
        if (acc.type === 2 || acc.style) {
          accessory = serializeButtonComponent(acc);
        } else if (acc.url || accMedia?.url) {
          accessory = {
            type: 11,
            media: { url: acc.url || accMedia?.url }
          };
        } else if (acc.type === 'thumbnail' && acc.url) {
          accessory = {
            type: 11,
            media: { url: acc.url }
          };
        } else if (acc.type === 'button') {
          accessory = serializeButtonComponent({
            type: 2,
            style: 1,
            label: (acc.label as string) || 'Action',
            emoji: acc.emoji
          });
        }
      }

      if (accessory) {
        return {
          type: 9,
          components: [
            { type: 10, content: secText }
          ],
          accessory: accessory
        };
      } else {
        // Discord V2: A Section requires an accessory; fallback cleanly to Type 10 Text Display
        return {
          type: 10,
          content: secText
        };
      }
    }

    case 10: { // Text Display
      return {
        type: 10,
        content: (comp.text as string) || (comp.content as string) || ''
      };
    }

    case 11: { // Thumbnail
      const compMedia = comp.media as Record<string, unknown> | undefined;
      return {
        type: 11,
        media: { url: (comp.url as string) || compMedia?.url || '' }
      };
    }

    case 12: { // Media Gallery
      const rawItems = Array.isArray(comp.items) ? comp.items : [];
      const items = rawItems.slice(0, 4).map((it) => {
        const itMedia = typeof it === 'object' && it !== null && 'media' in it
          ? (it as { media: { url: string } }).media
          : null;
        const url = itMedia?.url || it;
        return { media: { url: String(url || '') } };
      });
      return {
        type: 12,
        items: items
      };
    }

    case 13: { // File
      const compFile = comp.file as Record<string, unknown> | undefined;
      let fileUrl = (comp.url as string) || (compFile && (compFile.url as string)) || '';
      if (!fileUrl.startsWith('attachment://')) {
        const fname = (comp.filename as string) || 'project-report.pdf';
        fileUrl = `attachment://${fname}`;
      }
      return {
        type: 13,
        file: { url: fileUrl }
      };
    }

    case 14: { // Separator
      const sInt = parseInt(String(comp.spacing || 1), 10);
      const spacingVal = (!isNaN(sInt) && (sInt === 1 || sInt === 2)) ? sInt : (comp.spacing === 'small' ? 1 : 2);
      return {
        type: 14,
        divider: comp.divider !== false,
        spacing: spacingVal
      };
    }

    default:
      return null;
  }
}

/**
 * Builds the complete, official Discord Components V2 message payload (flags: 32768, Type 17 Containers).
 */
export function buildDiscordV2MessagePayload(
  containers: Type17Container[],
  messageContent?: string
): DiscordV2MessagePayload {
  const containerList = (containers || []).map((c) => {
    let accentDec = 43260;
    if (typeof c.accentColor === 'number') {
      accentDec = c.accentColor;
    } else if (typeof c.accentColor === 'string') {
      const cleanHex = c.accentColor.replace('#', '');
      const parsed = parseInt(cleanHex, 16);
      if (!isNaN(parsed)) accentDec = parsed;
    }

    const cComponents: unknown[] = [];

    // Header section (Author / Title / Description / Thumbnail)
    let headerMarkdown = '';
    if (c.author?.name) headerMarkdown += `__**${c.author.name}**__\n`;
    if (c.title) headerMarkdown += `**${c.title}**\n`;
    if (c.description) headerMarkdown += c.description;
    headerMarkdown = headerMarkdown.trim();

    if (headerMarkdown) {
      if (c.thumbnail) {
        cComponents.push({
          type: 9,
          components: [
            { type: 10, content: headerMarkdown }
          ],
          accessory: {
            type: 11,
            media: { url: c.thumbnail }
          }
        });
      } else {
        cComponents.push({
          type: 10,
          content: headerMarkdown
        });
      }
    }

    // Embed fields represented as Type 10 Text Display
    if (c.fields && c.fields.length > 0) {
      const fieldsText = c.fields.map((f) => `**${f.name}**\n${f.value}`).join('\n\n');
      cComponents.push({
        type: 10,
        content: fieldsText
      });
    }

    // Large Banner / Image represented as Type 12 Media Gallery
    if (c.image) {
      cComponents.push({
        type: 12,
        items: [
          { media: { url: c.image } }
        ]
      });
    }

    // Child components inside Container
    (c.components || []).forEach((comp) => {
      const serialized = serializeMessageComponent(comp as unknown as Record<string, unknown>);
      if (serialized) {
        cComponents.push(serialized);
      }
    });

    // Footer represented as Type 10 subtext (-# text)
    if (c.footer?.text) {
      cComponents.push({
        type: 10,
        content: `-# ${c.footer.text}`
      });
    }

    return {
      type: 17 as const,
      accent_color: accentDec,
      spoiler: Boolean(c.isSpoiler),
      components: cComponents
    };
  });

  return {
    content: messageContent || undefined,
    flags: 32768,
    components: containerList
  };
}

/**
 * Builds the Discord Modal payload view for modal-only form components.
 */
export function buildDiscordModalPayload(containers: Type17Container[]): DiscordModalPayload {
  const modalComponents: unknown[] = [];

  (containers || []).forEach((c) => {
    (c.components || []).forEach((comp) => {
      const rec = comp as unknown as Record<string, unknown>;
      const t = rec.type;

      if (t === 4) { // Text Input
        modalComponents.push({
          type: 1,
          components: [
            {
              type: 4,
              custom_id: (rec.custom_id as string) || (rec.id as string) || `input_${Date.now()}`,
              label: (rec.label as string) || 'Form Input',
              style: rec.paragraph || rec.style === 2 ? 2 : 1,
              placeholder: (rec.placeholder as string) || '',
              required: rec.required !== false
            }
          ]
        });
      } else if (t === 18) { // Label Component
        modalComponents.push({
          type: 18,
          label: (rec.label as string) || 'Repository',
          description: (rec.description as string) || 'Select a repository to link with your project.',
          required: Boolean(rec.required),
          component: {
            type: 3,
            custom_id: `sel_${(rec.id as string) || Date.now()}`,
            placeholder: (rec.placeholder as string) || 'Choose a repository...',
            options: [
              { label: 'Option 1', value: 'opt_1' },
              { label: 'Option 2', value: 'opt_2' }
            ]
          }
        });
      } else if (t === 21) { // Radio Group
        const rawOpts = Array.isArray(rec.options) ? (rec.options as Record<string, unknown>[]) : [];
        modalComponents.push({
          type: 21,
          custom_id: (rec.custom_id as string) || (rec.id as string) || `rg_${Date.now()}`,
          label: (rec.label as string) || 'Visibility',
          options: rawOpts.map((o, idx) => ({
            label: (o.label as string) || `Choice ${idx + 1}`,
            value: (o.value as string) || `val_${idx + 1}`,
            default: Boolean(o.selected)
          }))
        });
      } else if (t === 22) { // Checkbox Group
        const rawOpts = Array.isArray(rec.options) ? (rec.options as Record<string, unknown>[]) : [];
        modalComponents.push({
          type: 22,
          custom_id: (rec.custom_id as string) || (rec.id as string) || `cg_${Date.now()}`,
          label: (rec.question as string) || 'Languages',
          options: rawOpts.map((o, idx) => ({
            label: (o.label as string) || `Option ${idx + 1}`,
            value: (o.value as string) || `opt_${idx + 1}`,
            default: Boolean(o.checked)
          }))
        });
      } else if (t === 23) { // Checkbox
        modalComponents.push({
          type: 23,
          custom_id: (rec.custom_id as string) || (rec.id as string) || `chk_${Date.now()}`,
          label: (rec.label as string) || 'Enable notifications',
          default: Boolean(rec.checked)
        });
      }
    });
  });

  return {
    type: 9,
    data: {
      title: 'Discord Modal / Form Components View',
      custom_id: 'modal_reference_sheet',
      components: modalComponents.length > 0 ? modalComponents : [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'sample_input',
              label: 'Feedback',
              style: 2,
              placeholder: 'Enter details...'
            }
          ]
        }
      ]
    }
  };
}

/**
 * Counts components recursively across container tree to enforce the 40 component limit.
 */
export function countComponentsRecursive(comp: Record<string, unknown>): number {
  let count = 1;
  if (comp.components && Array.isArray(comp.components)) {
    comp.components.forEach((child: unknown) => {
      if (child && typeof child === 'object') {
        count += countComponentsRecursive(child as Record<string, unknown>);
      }
    });
  }
  return count;
}

/**
 * Validates a Discord Components V2 payload against strict Discord rules.
 */
export function validateDiscordV2Payload(payloadInput: unknown): DiscordV2ValidationResult {
  const payload = (payloadInput && typeof payloadInput === 'object' ? payloadInput : {}) as Record<string, unknown>;

  const rules = {
    flags: payload.flags === 32768,
    noLegacy: payload.embeds === undefined && payload.poll === undefined,
    actionRowsWrapped: true,
    partialEmoji: true,
    sectionAccessories: true,
    mediaObjects: true,
    attachmentProtocol: true,
    spacingEnums: true
  };

  let totalCount = 0;
  if (payload.components && Array.isArray(payload.components)) {
    payload.components.forEach((c: unknown) => {
      if (!c || typeof c !== 'object') return;
      const cRec = c as Record<string, unknown>;
      totalCount += countComponentsRecursive(cRec);

      const inspectChildren = (items: unknown[]) => {
        if (!items || !Array.isArray(items)) return;
        items.forEach((itemUnknown) => {
          if (!itemUnknown || typeof itemUnknown !== 'object') return;
          const item = itemUnknown as Record<string, unknown>;

          if (item.type === 1) {
            if (item.items !== undefined || item.label !== undefined) {
              rules.actionRowsWrapped = false;
            }
            if (Array.isArray(item.components)) {
              item.components.forEach((childUnknown: unknown) => {
                const child = (childUnknown && typeof childUnknown === 'object' ? childUnknown : {}) as Record<string, unknown>;
                const childEmoji = child.emoji as Record<string, unknown> | undefined;
                if (child.type === 2 && child.emoji && (typeof child.emoji !== 'object' || !childEmoji?.name)) {
                  rules.partialEmoji = false;
                }
              });
            }
          }
          if (item.type === 9) {
            if (!item.accessory || !Array.isArray(item.components) || item.components.length === 0) {
              rules.sectionAccessories = false;
            }
          }
          if (item.type === 12 && Array.isArray(item.items)) {
            item.items.forEach((m: unknown) => {
              const mRec = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
              const mMedia = mRec.media as Record<string, unknown> | undefined;
              if (typeof m !== 'object' || !mRec.media || !mMedia?.url) {
                rules.mediaObjects = false;
              }
            });
          }
          if (item.type === 13) {
            const itemFile = item.file as Record<string, unknown> | undefined;
            const fileUrl = itemFile?.url;
            if (!item.file || typeof fileUrl !== 'string' || !fileUrl.startsWith('attachment://')) {
              rules.attachmentProtocol = false;
            }
          }
          if (item.type === 14) {
            if (item.spacing !== 1 && item.spacing !== 2) {
              rules.spacingEnums = false;
            }
          }
          if (Array.isArray(item.components)) inspectChildren(item.components);
        });
      };

      if (Array.isArray(cRec.components)) {
        inspectChildren(cRec.components);
      }
    });
  }

  const isAllPassed = Object.values(rules).every(Boolean) && totalCount <= 40;

  return { rules, totalCount, isAllPassed };
}

/**
 * Bidirectional JSON parser converting a raw Discord API payload back into interactive builder state.
 */
export function parseDiscordPayloadToState(parsedInput: unknown): { messageContent: string; containers: Type17Container[] } {
  const parsed = (parsedInput && typeof parsedInput === 'object' ? parsedInput : {}) as Record<string, unknown>;
  let messageContent = '';
  if (parsed.content !== undefined && typeof parsed.content === 'string') {
    messageContent = parsed.content;
  }

  if (!parsed || !Array.isArray(parsed.components)) {
    throw new Error('Root payload must contain a "components" array.');
  }

  const loadedContainers: Type17Container[] = [];

  parsed.components.forEach((itemUnknown: unknown, idx: number) => {
    if (!itemUnknown || typeof itemUnknown !== 'object') return;
    const item = itemUnknown as Record<string, unknown>;

    if (item.type === 17) {
      const hexColor = item.accent_color !== undefined
        ? `#${(item.accent_color as number).toString(16).padStart(6, '0')}`
        : ((item.accentColor as string) || '#00a8fc');

      const c17: Type17Container = {
        id: (item.id as string) || `c17_${idx + 1}`,
        accentColor: hexColor,
        isSpoiler: Boolean(item.spoiler || item.isSpoiler),
        author: { name: '', icon_url: '' },
        title: '',
        description: '',
        fields: [],
        thumbnail: '',
        image: '',
        footer: { text: '', icon_url: '' },
        components: []
      };

      const childComps = Array.isArray(item.components) ? (item.components as Record<string, unknown>[]) : [];

      childComps.forEach((child) => {
        const childAcc = child.accessory as Record<string, unknown> | undefined;
        const childAccMedia = childAcc?.media as Record<string, unknown> | undefined;
        const childCompsInner = child.components as Record<string, unknown>[] | undefined;

        // Helper to extract author, title, description from header markdown
        const parseHeaderLines = (rawContent: string) => {
          const lines = rawContent.split('\n');
          let lineIdx = 0;
          if (lines[lineIdx] && lines[lineIdx].startsWith('__**') && lines[lineIdx].endsWith('**__')) {
            c17.author = { name: lines[lineIdx].slice(4, -4), icon_url: '' };
            lineIdx++;
          } else if (lines[lineIdx] && lines[lineIdx].startsWith('*') && lines[lineIdx].endsWith('*') && !lines[lineIdx].startsWith('**')) {
            c17.author = { name: lines[lineIdx].slice(1, -1), icon_url: '' };
            lineIdx++;
          }
          if (lines[lineIdx] && lines[lineIdx].startsWith('**') && lines[lineIdx].endsWith('**')) {
            c17.title = lines[lineIdx].slice(2, -2);
            lineIdx++;
          }
          c17.description = lines.slice(lineIdx).join('\n');
        };

        // Header Section with Thumbnail Accessory
        if (child.type === 9 && childCompsInner && childCompsInner[0] && !c17.title && !c17.description) {
          const rawContent = (childCompsInner[0].content as string) || '';
          parseHeaderLines(rawContent);
          if (childAccMedia?.url || childAcc?.url) {
            c17.thumbnail = (childAccMedia?.url as string) || (childAcc?.url as string);
          }
        }
        // Plain Header Text Display
        else if (child.type === 10 && !c17.title && !c17.description && typeof child.content === 'string' && !child.content.startsWith('-# ')) {
          parseHeaderLines(child.content);
        }
        // Large Image via Media Gallery
        else if (child.type === 12 && Array.isArray(child.items) && !c17.image) {
          const firstMedia = child.items[0] as Record<string, unknown> | undefined;
          const mediaObj = firstMedia?.media as Record<string, unknown> | undefined;
          if (mediaObj?.url) {
            c17.image = mediaObj.url as string;
          }
        }
        // Footer Subtext
        else if (child.type === 10 && typeof child.content === 'string' && child.content.startsWith('-# ')) {
          c17.footer = {
            text: child.content.replace('-# ', ''),
            icon_url: ''
          };
        }
        // Inner components
        else {
          c17.components.push(child as unknown as DiscordInnerComponent);
        }
      });

      loadedContainers.push(c17);
    }
  });

  return { messageContent, containers: loadedContainers };
}
