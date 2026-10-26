export type BotModuleFieldType = 'BOOLEAN' | 'INTEGER' | 'FLOAT' | 'STRING' | 'JSON' | 'TEXT' | 'ARRAY';

export interface BotModuleFieldSchema {
  type: BotModuleFieldType;
  label?: string;
  displayName?: string;
  description?: string;
  min?: number;
  max?: number;
  default?: unknown;
  options?: string[];
  items?: {
    type?: string;
  };
}

export interface NetworkKeySchema {
  type?: string;
  label?: string;
  displayName?: string;
  description?: string;
  category?: string;
  default?: unknown;
  uniform?: boolean;
  options?: string[];
}

export type BotModuleSchema =
  | Record<string, Record<string, BotModuleFieldSchema>>
  | {
      modules?: Record<string, Record<string, BotModuleFieldSchema>>;
      networkKeys?: Record<string, NetworkKeySchema>;
      moduleDisplayNames?: Record<string, string>;
      networkKeyDisplayNames?: Record<string, string>;
      networkKeyCategories?: Record<string, string>;
      [key: string]: unknown;
    }
  | Record<string, unknown>;

export type BotModuleValues = Record<string, unknown>;

export interface ModuleInheritance {
  isOverridden: boolean;
  values?: BotModuleValues;
  effectiveConfig?: BotModuleValues;
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

export interface NetworkDefaultPayload {
  hubGuildId?: string;
  servers?: number;
  schema?: {
    modules?: Record<string, Record<string, BotModuleFieldSchema>>;
    networkKeys?: Record<string, NetworkKeySchema>;
    moduleDisplayNames?: Record<string, string>;
    networkKeyDisplayNames?: Record<string, string>;
    networkKeyCategories?: Record<string, string>;
  };
  modules?: Record<string, BotModuleValues>;
  network?: Record<string, unknown>;
}

export interface BotModulePatchRequest {
  modules?: Record<string, Record<string, unknown>>;
  network?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}
