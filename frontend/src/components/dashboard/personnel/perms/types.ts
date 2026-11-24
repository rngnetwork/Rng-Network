export type PermsEditorTab = 'visual' | 'json';

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

export type PermsObject = Record<string, unknown>;

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

export type ExplorerView =
  | { type: 'root' }
  | { type: 'folder'; folderId: string }
  | { type: 'file'; folderId: string; fileId: string };
