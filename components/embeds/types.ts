export type ComponentType =
  | 1   // ACTION_ROW
  | 2   // BUTTON
  | 3   // STRING_SELECT
  | 4   // TEXT_INPUT (Modal Only)
  | 5   // USER_SELECT
  | 6   // ROLE_SELECT
  | 7   // MENTIONABLE_SELECT
  | 8   // CHANNEL_SELECT
  | 9   // SECTION
  | 10  // TEXT_DISPLAY
  | 11  // THUMBNAIL
  | 12  // MEDIA_GALLERY
  | 13  // FILE
  | 14  // SEPARATOR
  | 17  // CONTAINER
  | 18  // LABEL (Modal Only)
  | 19  // FILE_UPLOAD (Modal Only)
  | 21  // RADIO_GROUP (Modal Only)
  | 22  // CHECKBOX_GROUP (Modal Only)
  | 23; // CHECKBOX (Modal Only)

export type ButtonStyle = 1 | 2 | 3 | 4 | 5; // 1: Primary (Blurple), 2: Secondary (Grey), 3: Success (Green), 4: Danger (Red), 5: Link (URL)

export interface PartialEmojiObject {
  id?: string;
  name: string;
  animated?: boolean;
}

export interface DiscordButtonComponent {
  type: 2;
  id?: string;
  style: ButtonStyle;
  label?: string;
  emoji?: string | PartialEmojiObject;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string | PartialEmojiObject;
  default?: boolean;
  selected?: boolean;
}

export interface DiscordSelectComponent {
  type: 3 | 5 | 6 | 7 | 8;
  id?: string;
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
  options?: SelectOption[];
  channel_types?: number[];
  default_values?: { id: string; type: 'user' | 'role' | 'channel' }[];
}

export type DiscordActionRowChild = DiscordButtonComponent | DiscordSelectComponent;

export interface DiscordActionRowComponent {
  type: 1;
  id?: string;
  label?: string;
  items?: DiscordActionRowChild[];
  components?: DiscordActionRowChild[];
}

export interface DiscordTextDisplayComponent {
  type: 10;
  id?: string;
  text?: string;
  content?: string;
}

export type SectionAccessoryButton = DiscordButtonComponent;

export interface SectionAccessoryThumbnail {
  type: 11;
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
  type: 9;
  id?: string;
  text?: string;
  components?: DiscordTextDisplayComponent[];
  accessory?:
    | DiscordButtonComponent
    | DiscordThumbnailComponent
    | LegacySectionAccessory
    | { type: number; media?: { url: string }; url?: string };
}

export interface DiscordThumbnailComponent {
  type: 11;
  id?: string;
  url?: string;
  media?: { url: string };
}

export interface DiscordMediaItem {
  media: { url: string };
  description?: string;
  spoiler?: boolean;
}

export interface DiscordMediaGalleryComponent {
  type: 12;
  id?: string;
  items: (string | DiscordMediaItem)[];
}

export interface DiscordFileComponent {
  type: 13;
  id?: string;
  filename?: string;
  filesize?: string;
  url?: string;
  file?: { url: string };
}

export interface DiscordSeparatorComponent {
  type: 14;
  id?: string;
  divider?: boolean;
  spacing: 1 | 2; // 1 = small, 2 = large
}

// ---------------------------------------------------------------------------
// Modal-Only Interactive Components (Discord Forms)
// ---------------------------------------------------------------------------
export interface DiscordTextInputComponent {
  type: 4;
  id?: string;
  custom_id: string;
  label: string;
  style?: 1 | 2; // 1: Short, 2: Paragraph
  placeholder?: string;
  required?: boolean;
  value?: string;
  paragraph?: boolean;
  min_length?: number;
  max_length?: number;
}

export interface DiscordLabelComponent {
  type: 18;
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
  type: 21;
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
  type: 22;
  id?: string;
  custom_id: string;
  question?: string;
  options: CheckboxOption[];
}

export interface DiscordCheckboxComponent {
  type: 23;
  id?: string;
  custom_id: string;
  label: string;
  checked?: boolean;
}

// ---------------------------------------------------------------------------
// Inner & Container Component Unions
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Validation & Serialization Specifications
// ---------------------------------------------------------------------------
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

export type DiscordContainerChildComponent =
  | DiscordActionRowComponent
  | DiscordTextDisplayComponent
  | DiscordSectionComponent
  | DiscordMediaGalleryComponent
  | DiscordSeparatorComponent
  | DiscordFileComponent;

export interface DiscordV2ContainerPayload {
  type: 17;
  accent_color: number;
  spoiler: boolean;
  components: DiscordContainerChildComponent[];
}

export type DiscordTopLevelComponent =
  | DiscordV2ContainerPayload
  | DiscordTextDisplayComponent
  | DiscordActionRowComponent;

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

export interface BackendEmbedTemplate {
  id: string;
  name: string;
  description?: string;
  serverId: string;
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

export interface BackendDispatchLog {
  id: string;
  dispatchId: string;
  type: 'IMMEDIATE_BOT' | 'SCHEDULED_BOT';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING' | 'SCHEDULED' | 'CANCELLED';
  serverId: string;
  channelId: string;
  operatorId: number;
  operatorUsername?: string;
  discordMessageId?: string;
  errorMessage?: string;
  latencyMs?: number;
  timestamp: string;
}

export type ActionType = 'ROLE' | 'TICKET' | 'REPLY' | 'DM';

export type RoleSubtype = 'TOGGLE' | 'ADD' | 'REMOVE';

export type ResponseType = 'EPHEMERAL_TEXT' | 'PUBLIC_TEXT' | 'EPHEMERAL_EMBED' | 'PUBLIC_EMBED' | 'DM_EMBED';

export interface CompoundOperation {
  operationType: 'CREATE_TICKET' | 'SEND_DM_TEMPLATE' | 'SEND_CHANNEL_MESSAGE';
  channelPrefix?: string;
  membersToAdd?: string[];
  templateId?: string;
}

export interface EmbedAction {
  id?: string;
  actionId: string;
  serverId?: string;
  serverIds?: string[];
  isGlobal?: boolean;
  name: string;
  description?: string;
  actionType: ActionType;
  roleSubtype?: RoleSubtype;
  roleId?: string;
  roleName?: string;
  channelPrefix?: string;
  welcomeMessage?: string;
  replyContent?: string;
  isEphemeral?: boolean;
  dmContent?: string;
  requiredUser?: boolean;
  requiredRole?: boolean;
  responseType?: ResponseType;
  responseEmbedTemplateId?: string;
  confirmationMessage?: string;
  compoundOperations?: CompoundOperation[];
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateActionPayload {
  serverId?: string;
  serverIds?: string[];
  isGlobal?: boolean;
  name: string;
  description?: string;
  actionType: ActionType;
  roleSubtype?: RoleSubtype;
  roleId?: string;
  roleName?: string;
  channelPrefix?: string;
  welcomeMessage?: string;
  replyContent?: string;
  isEphemeral?: boolean;
  dmContent?: string;
  requiredUser?: boolean;
  requiredRole?: boolean;
  responseType?: ResponseType;
  responseEmbedTemplateId?: string;
  confirmationMessage?: string;
  compoundOperations?: CompoundOperation[];
}

export type UpdateActionPayload = CreateActionPayload;

export interface ServerRole {
  id: string;
  name: string;
  colorHex?: string | null;
  position: number;
  managed: boolean;
  assignableByBot: boolean;
}

export interface InteractionLogItem {
  id: string;
  actionId: string;
  actionType: ActionType;
  guildId: string;
  channelId?: string;
  messageId?: string;
  userId: string;
  username: string;
  status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' | 'MISSING_PERMISSIONS';
  details?: string;
  createdAt: string;
}
