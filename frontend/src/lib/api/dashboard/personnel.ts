import { httpClient, withTokenConfig } from '../core/client';
import type { ApiResponse } from '../core/types';

export interface MatrixRankItem {
  weight: number;
  code: string;
}

export interface MatrixDesignationItem {
  id: string;
  name: string;
}

export interface PopoverRoleItem {
  id: string;
  name: string;
  discordRoleId?: string;
}

export interface RoleHierarchyMatrixPayload {
  ranks: MatrixRankItem[];
  designations: MatrixDesignationItem[];
  cells: Record<string, PopoverRoleItem[]>;
}

export async function fetchRoleHierarchyMatrix(
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.get<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    withTokenConfig(accessToken)
  );
}

export async function addRoleToMatrix(
  payload: {
    rankWeight: number;
    designationId: string;
    name: string;
    discordRoleId?: string;
  },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'ADD_ROLE', ...payload },
    withTokenConfig(accessToken)
  );
}

export async function addDesignationToMatrix(
  payload: { name: string },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'ADD_DESIGNATION', ...payload },
    withTokenConfig(accessToken)
  );
}

export async function addRankToMatrix(
  payload: {
    code: string;
    weight: number;
    position?: 'prepend' | 'append';
  },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'ADD_RANK', ...payload },
    withTokenConfig(accessToken)
  );
}

export async function updateRoleInMatrix(
  roleId: string,
  payload: { name?: string; discordRoleId?: string },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'UPDATE_ROLE', roleId, ...payload },
    withTokenConfig(accessToken)
  );
}

export async function updateDesignationInMatrix(
  designationId: string,
  payload: { name: string },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'UPDATE_DESIGNATION', designationId, ...payload },
    withTokenConfig(accessToken)
  );
}

export async function updateRankInMatrix(
  rankWeight: number,
  payload: { code?: string; weight?: number },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'UPDATE_RANK', rankWeight, ...payload },
    withTokenConfig(accessToken)
  );
}

export async function deleteRoleFromMatrix(
  roleId: string,
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'DELETE_ROLE', roleId },
    withTokenConfig(accessToken)
  );
}

export async function deleteDesignationFromMatrix(
  designationId: string,
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'DELETE_DESIGNATION', designationId },
    withTokenConfig(accessToken)
  );
}

export async function deleteRankFromMatrix(
  rankWeight: number,
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    { type: 'DELETE_RANK', rankWeight },
    withTokenConfig(accessToken)
  );
}

export async function mutateRoleHierarchyMatrix(
  action: { type: string; [key: string]: unknown },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix',
    action,
    withTokenConfig(accessToken)
  );
}
