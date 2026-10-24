export type BotModuleFieldType = 'BOOLEAN' | 'INTEGER' | 'STRING' | 'JSON';

export interface BotModuleFieldSchema {
  type: BotModuleFieldType;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  default?: unknown;
  options?: string[];
  items?: {
    type?: string;
  };
}

export type BotModuleSchema = Record<string, Record<string, BotModuleFieldSchema>>;

export type BotModuleValues = Record<string, unknown>;

export interface ModuleInheritance {
  isOverridden: boolean;
  values: BotModuleValues;
  networkDefault?: BotModuleValues;
  serverOverride?: BotModuleValues | null;
}

export interface ServerEffectiveModulesData {
  serverId?: string;
  guildId: string;
  serverSlug: string;
  serverName?: string;
  schema: BotModuleSchema;
  modules: Record<string, ModuleInheritance>;
}

export type NetworkModulesData = Record<string, BotModuleValues>;

export interface BotModulePatchRequest {
  modules: Record<string, Record<string, unknown>>;
}
