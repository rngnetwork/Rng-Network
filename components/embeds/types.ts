export type ComponentType =
  | 1   // ACTION_ROW
  | 2   // BUTTON
  | 3   // STRING_SELECT
  | 4   // TEXT_INPUT
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
  | 18  // LABEL
  | 19  // FILE_UPLOAD
  | 21  // RADIO_GROUP
  | 22  // CHECKBOX_GROUP
  | 23; // CHECKBOX

export type ButtonStyle = 1 | 2 | 3 | 4 | 5; // 1: Primary Blurple, 2: Secondary Grey, 3: Success Green, 4: Danger Red, 5: Link

export interface PartialEmojiObject {
  id?: string;
  name: string;
  animated?: boolean;
}

export interface DiscordButtonComponent {
  type: 2;
  id?: string;
  style: ButtonStyle;
  label: string;
  emoji?: string | PartialEmojiObject;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
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
}

export interface DiscordTextInputComponent {
  type: 4;
  id?: string;
  custom_id: string;
  label: string;
  style?: 1 | 2; // 1: Short, 2: Paragraph
  placeholder?: string;
  required?: boolean;
  value?: string;
}

export interface DiscordSectionComponent {
  type: 9;
  id?: string;
  text: string;
  accessory?: {
    type: 'thumbnail' | 'button';
    url?: string;
    label?: string;
    emoji?: string;
  };
}

export interface DiscordTextDisplayComponent {
  type: 10;
  id?: string;
  text: string;
}

export interface DiscordThumbnailComponent {
  type: 11;
  id?: string;
  url: string;
}

export interface DiscordMediaGalleryComponent {
  type: 12;
  id?: string;
  items: string[];
}

export interface DiscordFileComponent {
  type: 13;
  id?: string;
  filename: string;
  filesize?: string;
  url?: string;
}

export interface DiscordSeparatorComponent {
  type: 14;
  id?: string;
  divider: boolean;
  spacing: 1 | 2; // 1 = small, 2 = large
}

export interface DiscordLabelComponent {
  type: 18;
  id?: string;
  label: string;
  description?: string;
  required?: boolean;
  component?: any;
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

export interface DiscordActionRowComponent {
  type: 1;
  id?: string;
  label?: string;
  items: (DiscordButtonComponent | DiscordSelectComponent)[];
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
  activeSubTab: 'edit' | 'preview' | 'raw' | 'dispatch';
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
  createdAt?: string;
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
