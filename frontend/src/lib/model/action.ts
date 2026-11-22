export type ActionType = 'ROLE' | 'ROLE_VERIFY' | 'TICKET' | 'REPLY' | 'DM';

export type RoleSubtype = 'TOGGLE' | 'ADD' | 'REMOVE';

export type ResponseType =
  | 'EPHEMERAL_TEXT'
  | 'PUBLIC_TEXT'
  | 'EPHEMERAL_EMBED'
  | 'PUBLIC_EMBED'
  | 'DM_EMBED';

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
  dispatchDMLogsWithFallback?: boolean;
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
  dispatchDMLogsWithFallback?: boolean;
}

export type UpdateActionPayload = CreateActionPayload;

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

export type InteractionLog = InteractionLogItem;
