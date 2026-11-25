export type PermsEditorTab = 'visual' | 'json';

export type PermsObject = Record<string, unknown>;

export interface PermsRoleMetadata {
  role_name: string;
  designation_id: string;
  designation_name: string;
  code: string;
  weight: number;
  version: number;
  last_modified_at?: string;
  last_modified_by?: string;
}

export interface PermsRoleSchema {
  title: string;
  metadata: PermsRoleMetadata;
  permissions: PermsObject;
}

export interface PermsFileNode {
  id: string;
  name: string;
  fileName: string;
  designationId: string;
  designationName: string;
  rankWeight: number;
  rankCode: string;
  schema: PermsRoleSchema;
}

export interface PermsFolderNode {
  id: string;
  name: string;
  files: PermsFileNode[];
}

export interface PermsServerSummary {
  slug: string;
  name: string;
  iconUrl?: string | null;
}

export interface PermsExplorerResponse {
  folders: PermsFolderNode[];
  servers: PermsServerSummary[];
  labels: Record<string, string>;
}

export interface RolePermissionsDto {
  roleId: string;
  designationId: string;
  designationName: string;
  roleName: string;
  rankWeight: number;
  rankCode: string;
  permissions: PermsObject;
  labels: Record<string, string>;
  version: number;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface EffectivePermissions {
  userId: string;
  rolesEvaluated: string[];
  isPreviewMode: boolean;
  previewRoleId?: string | null;
  previewRoleName?: string | null;
  callerMaxRankWeight: number;
  permissions: PermsObject;
}

export interface PreviewRoleOption {
  roleId: string;
  designationId: string;
  designationName: string;
  roleName: string;
  rankWeight: number;
  rankCode: string;
}

export type ExplorerView =
  | { type: 'root' }
  | { type: 'folder'; folderId: string }
  | { type: 'file'; folderId: string; fileId: string };
