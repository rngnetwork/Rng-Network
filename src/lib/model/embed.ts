import type { PartialEmojiObject } from './common';

export const DISCORD_SAFE_URL_REGEX = /^(https?:\/\/|discord:\/\/)/i;

export enum ComponentType {
  ACTION_ROW = 1,
  BUTTON = 2,
  STRING_SELECT = 3,
  TEXT_INPUT = 4,
  USER_SELECT = 5,
  ROLE_SELECT = 6,
  MENTIONABLE_SELECT = 7,
  CHANNEL_SELECT = 8,
  SECTION = 9,
  TEXT_DISPLAY = 10,
  THUMBNAIL = 11,
  MEDIA_GALLERY = 12,
  FILE = 13,
  SEPARATOR = 14,
  CONTAINER = 17,
  LABEL = 18,
  FILE_UPLOAD = 19,
  RADIO_GROUP = 21,
  CHECKBOX_GROUP = 22,
  CHECKBOX = 23,
}

export type ButtonStyle = 1 | 2 | 3 | 4 | 5;

export interface DiscordButtonComponent {
  type: ComponentType.BUTTON;
  id?: string;
  style: ButtonStyle;
  label?: string;
  emoji?: string | PartialEmojiObject;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface DiscordSelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string | PartialEmojiObject;
  default?: boolean;
  selected?: boolean;
}

export type SelectOption = DiscordSelectOption;

export interface DiscordStringSelectComponent {
  type: ComponentType.STRING_SELECT;
  id?: string;
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
  options: DiscordSelectOption[];
  invokerButtonId?: string;
}

export interface DiscordEntitySelectComponent {
  type:
    | ComponentType.USER_SELECT
    | ComponentType.ROLE_SELECT
    | ComponentType.MENTIONABLE_SELECT
    | ComponentType.CHANNEL_SELECT;
  id?: string;
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
  options?: DiscordSelectOption[];
  channel_types?: number[];
  default_values?: { id: string; type: 'user' | 'role' | 'channel' }[];
}

export type DiscordSelectComponent = DiscordStringSelectComponent | DiscordEntitySelectComponent;

export type DiscordActionRowChild = DiscordButtonComponent | DiscordSelectComponent;

export interface DiscordActionRowComponent {
  type: ComponentType.ACTION_ROW;
  id?: string;
  label?: string;
  items?: DiscordActionRowChild[];
  components: DiscordActionRowChild[];
}

export interface DiscordTextDisplayComponent {
  type: ComponentType.TEXT_DISPLAY;
  id?: string;
  text?: string;
  content: string;
}

export interface DiscordThumbnailComponent {
  type: ComponentType.THUMBNAIL;
  id?: string;
  media_url?: string;
  url?: string;
  media?: { url: string };
  description?: string;
  spoiler?: boolean;
}

export type SectionAccessoryButton = DiscordButtonComponent;

export interface SectionAccessoryThumbnail {
  type: ComponentType.THUMBNAIL;
  id?: string;
  media: { url: string };
  url?: string;
}

export interface LegacySectionAccessory {
  type: 'thumbnail' | 'button';
  url?: string;
  label?: string;
  emoji?: string;
}

export interface DiscordSectionComponent {
  type: ComponentType.SECTION;
  id?: string;
  text?: string;
  components: DiscordTextDisplayComponent[];
  accessory?:
    | DiscordThumbnailComponent
    | DiscordButtonComponent
    | LegacySectionAccessory;
}

export interface DiscordMediaItem {
  url?: string;
  media?: { url: string };
  description?: string;
  spoiler?: boolean;
}

export interface DiscordMediaGalleryComponent {
  type: ComponentType.MEDIA_GALLERY;
  id?: string;
  items: (string | DiscordMediaItem)[];
}

export interface DiscordFileComponent {
  type: ComponentType.FILE;
  id?: string;
  filename?: string;
  filesize?: string;
  url?: string;
  file?: { url: string };
}

export interface DiscordSeparatorComponent {
  type: ComponentType.SEPARATOR;
  id?: string;
  divider?: boolean;
  spacing: 1 | 2;
}

export interface DiscordTextInputComponent {
  type: ComponentType.TEXT_INPUT;
  id?: string;
  custom_id: string;
  label: string;
  style?: 1 | 2;
  placeholder?: string;
  required?: boolean;
  value?: string;
  paragraph?: boolean;
  min_length?: number;
  max_length?: number;
}

export interface DiscordLabelComponent {
  type: ComponentType.LABEL;
  id?: string;
  label: string;
  description?: string;
  required?: boolean;
  component?: unknown;
}

export interface RadioOption {
  label: string;
  value: string;
  selected?: boolean;
}

export interface DiscordRadioGroupComponent {
  type: ComponentType.RADIO_GROUP;
  id?: string;
  custom_id: string;
  label?: string;
  options: RadioOption[];
}

export interface CheckboxOption {
  label: string;
  value: string;
  checked?: boolean;
}

export interface DiscordCheckboxGroupComponent {
  type: ComponentType.CHECKBOX_GROUP;
  id?: string;
  custom_id: string;
  question?: string;
  options: CheckboxOption[];
}

export interface DiscordCheckboxComponent {
  type: ComponentType.CHECKBOX;
  id?: string;
  custom_id: string;
  label: string;
  checked?: boolean;
}

export type DiscordInnerComponent =
  | DiscordActionRowComponent
  | DiscordButtonComponent
  | DiscordSelectComponent
  | DiscordTextInputComponent
  | DiscordSectionComponent
  | DiscordTextDisplayComponent
  | DiscordThumbnailComponent
  | DiscordMediaGalleryComponent
  | DiscordFileComponent
  | DiscordSeparatorComponent
  | DiscordLabelComponent
  | DiscordRadioGroupComponent
  | DiscordCheckboxGroupComponent
  | DiscordCheckboxComponent;

export type DiscordContainerChildComponent =
  | DiscordTextDisplayComponent
  | DiscordActionRowComponent
  | DiscordSectionComponent
  | DiscordMediaGalleryComponent
  | DiscordSeparatorComponent
  | DiscordFileComponent;

export interface DiscordContainerComponent {
  type: ComponentType.CONTAINER;
  accent_color?: number;
  spoiler?: boolean;
  components: DiscordContainerChildComponent[];
}

export interface DiscordV2ContainerPayload {
  type: ComponentType.CONTAINER;
  accent_color: number;
  spoiler: boolean;
  components: DiscordContainerChildComponent[];
}

export type DiscordTopLevelComponent =
  | DiscordContainerComponent
  | DiscordV2ContainerPayload
  | DiscordTextDisplayComponent
  | DiscordActionRowComponent
  | DiscordSectionComponent
  | DiscordMediaGalleryComponent
  | DiscordSeparatorComponent;

export interface DiscordV2MessagePayload {
  flags: 32768;
  content?: string;
  components: DiscordTopLevelComponent[];
}

export interface DiscordModalPayload {
  type: 9;
  data: {
    title: string;
    custom_id: string;
    components: unknown[];
  };
}

export interface EmbedField {
  id?: string;
  name: string;
  value: string;
  inline?: boolean;
}

export interface Type17Container {
  id: string;
  accentColor: string;
  isSpoiler?: boolean;
  author?: { name: string; icon_url?: string };
  title?: string;
  description?: string;
  fields?: EmbedField[];
  thumbnail?: string;
  image?: string;
  footer?: { text: string; icon_url?: string };
  components: DiscordInnerComponent[];
}

export interface MessageBuilderState {
  activeSubTab: 'edit' | 'preview' | 'raw' | 'dispatch' | 'templates';
  rawPayloadMode: 'message' | 'modal';
  message: {
    content: string;
  };
  type17Containers: Type17Container[];
}

export interface TemplateItem {
  id: string;
  templateId?: string;
  name: string;
  description: string;
  badge: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
  isPublic?: boolean;
  serverId?: string;
  state: {
    message: { content: string };
    type17Containers: Type17Container[];
  };
}

export interface CustomComponentPreset {
  id: string;
  name: string;
  type: number;
  description: string;
  component: DiscordInnerComponent;
  createdAt?: string;
}

export interface DiscordV2RulesValidation {
  flags: boolean;
  noLegacy: boolean;
  actionRowsWrapped: boolean;
  partialEmoji: boolean;
  sectionAccessories: boolean;
  mediaObjects: boolean;
  attachmentProtocol: boolean;
  spacingEnums: boolean;
}

export interface DiscordV2ValidationResult {
  rules: DiscordV2RulesValidation;
  totalCount: number;
  isAllPassed: boolean;
}

export interface ClientValidationViolation {
  code: string;
  message: string;
  path?: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ClientValidationReport {
  valid: boolean;
  violations: ClientValidationViolation[];
  totalContainers: number;
  totalComponents: number;
  totalActionRows: number;
  cumulativeCharacters: number;
  compiledPayload: DiscordV2MessagePayload;
}

export interface TemplateData {
  id: string;
  templateId?: string;
  name: string;
  description?: string;
  serverId?: string;
  authorId: number;
  authorUsername?: string;
  tags: string[];
  category: string;
  public: boolean;
  isPublic?: boolean;
  active: boolean;
  version: number;
  payloadJson: Record<string, unknown>;
  payload?: Record<string, unknown>;
  components: unknown[];
  createdAt: string;
  updatedAt: string;
}

export type BackendEmbedTemplate = TemplateData;

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  serverId?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  publicTemplate?: boolean;
  payload?: Record<string, unknown>;
  payloadJson?: Record<string, unknown>;
  components?: unknown[];
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  serverId?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  publicTemplate?: boolean;
  active?: boolean;
  payload?: Record<string, unknown>;
  payloadJson?: Record<string, unknown>;
  components?: unknown[];
}
