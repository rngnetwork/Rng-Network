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
  },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix/roles',
    payload,
    withTokenConfig(accessToken)
  );
}

export async function addDesignationToMatrix(
  payload: { name: string },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.post<RoleHierarchyMatrixPayload>(
    '/personnel/hierarchy/matrix/designations',
    payload,
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
    '/personnel/hierarchy/matrix/ranks',
    payload,
    withTokenConfig(accessToken)
  );
}

export async function updateRoleInMatrix(
  roleId: string,
  payload: { name: string },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.patch<RoleHierarchyMatrixPayload>(
    `/personnel/hierarchy/matrix/roles/${roleId}`,
    payload,
    withTokenConfig(accessToken)
  );
}

export async function updateDesignationInMatrix(
  designationId: string,
  payload: { name: string },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.patch<RoleHierarchyMatrixPayload>(
    `/personnel/hierarchy/matrix/designations/${designationId}`,
    payload,
    withTokenConfig(accessToken)
  );
}

export async function updateRankInMatrix(
  rankWeight: number,
  payload: { code: string; weight: number },
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.patch<RoleHierarchyMatrixPayload>(
    `/personnel/hierarchy/matrix/ranks/${rankWeight}`,
    payload,
    withTokenConfig(accessToken)
  );
}

export async function deleteRoleFromMatrix(
  roleId: string,
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.delete<RoleHierarchyMatrixPayload>(
    `/personnel/hierarchy/matrix/roles/${roleId}`,
    withTokenConfig(accessToken)
  );
}

export async function deleteDesignationFromMatrix(
  designationId: string,
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.delete<RoleHierarchyMatrixPayload>(
    `/personnel/hierarchy/matrix/designations/${designationId}`,
    withTokenConfig(accessToken)
  );
}

export async function deleteRankFromMatrix(
  rankWeight: number,
  accessToken?: string
): Promise<ApiResponse<RoleHierarchyMatrixPayload>> {
  return httpClient.delete<RoleHierarchyMatrixPayload>(
    `/personnel/hierarchy/matrix/ranks/${rankWeight}`,
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
