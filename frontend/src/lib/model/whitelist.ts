export interface WhitelistedUser {
  id: number;
  email: string;
  userName: string;
  provider: string;
  role: string;
  rankWeight?: number;
  designations: string[];
  roles: string[];
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordLinked: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type WhitelistUser = WhitelistedUser;

export interface CreateWhitelistPayload {
  email: string;
  userName: string;
  provider?: string;
  designations: string[];
  roles: string[];
}

export interface UpdateWhitelistPayload {
  userName?: string;
  designations: string[];
  roles: string[];
}

export type PersonnelHierarchyMap = Record<string, string[]>;
export type HierarchyRankWeightsMap = Record<string, number>;

/**
 * Resolves the numeric rank weight (0-9) for a designation+role pair using the backend weight map,
 * falling back cleanly for legacy fixtures that omit weights.
 */
export function resolveRoleWeight(
  designation: string,
  roleName: string,
  weights: HierarchyRankWeightsMap = {}
): number {
  const cleanDes = designation.trim();
  const cleanRole = roleName.includes(':')
    ? roleName.split(':').slice(1).join(':').trim()
    : roleName.trim();
  const exactKey = `${cleanDes}:${cleanRole}`;
  if (typeof weights[exactKey] === 'number') {
    return weights[exactKey];
  }
  const normalizedTargetKey = exactKey.toLowerCase();
  for (const [k, v] of Object.entries(weights)) {
    if (k.trim().toLowerCase() === normalizedTargetKey && typeof v === 'number') {
      return v;
    }
  }
  const normalized = cleanRole.toLowerCase();
  if (normalized === 'chief high command') return 9;
  if (normalized === 'high command') return 8;
  if (normalized === 'director') return 7;
  if (normalized === 'executive director') return 6;
  if (normalized === 'minister' || normalized.startsWith('chancellor')) return 5;
  if (normalized === 'secretary') return 4;
  return 1;
}
