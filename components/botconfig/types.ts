export type ModuleCategory = 'all' | 'security' | 'moderation' | 'engagement' | 'utility' | 'economy';

export type ASTFieldType =
  | 'toggle'
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'channel_select'
  | 'role_select'
  | 'duration'
  | 'key_value_list';

export interface ASTFieldOption<T = string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
}

export interface ASTFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  errorMessage?: string;
}

export interface ASTFieldDependsOn {
  fieldId: string;
  value?: any;
  notValue?: any;
  operator?: 'equals' | 'not_equals' | 'contains' | 'truthy' | 'falsy';
}

export interface ASTField {
  id: string;
  label: string;
  description?: string;
  type: ASTFieldType;
  value: any;
  defaultValue?: any;
  placeholder?: string;
  options?: ASTFieldOption[];
  validation?: ASTFieldValidation;
  dependsOn?: ASTFieldDependsOn;
  badge?: string;
  disabled?: boolean;
  unit?: string;
  multiSelect?: boolean;
}

export interface Submodule {
  id: string;
  title: string;
  description: string;
  icon?: string;
  enabled: boolean;
  fields: ASTField[];
  badge?: string;
}

export interface BotModule {
  id: string;
  name: string;
  description: string;
  category: Exclude<ModuleCategory, 'all'>;
  icon: string;
  enabled: boolean;
  submoduleCount: number;
  submodules: Submodule[];
  tags: string[];
  badge?: string;
  isPopular?: boolean;
}

export interface DiscordChannelOption {
  id: string;
  name: string;
  type: number; // 0: text, 2: voice, 4: category, 15: forum, 5: announcement
  parentId?: string | null;
}

export interface DiscordRoleOption {
  id: string;
  name: string;
  color: string;
  position: number;
  managed?: boolean;
}
