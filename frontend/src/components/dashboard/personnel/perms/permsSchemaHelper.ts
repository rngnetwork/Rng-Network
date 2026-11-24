import type {
  MatrixRankItem,
  MatrixDesignationItem,
  PopoverRoleItem,
} from '@/lib/api/dashboard/personnel';
import type {
  PermsFolderNode,
  PermsFileNode,
  PermsRoleSchema,
  PermsObject,
} from './types';

export function generateRoleSchema(
  role: PopoverRoleItem,
  designation: MatrixDesignationItem,
  rankWeight: number,
  rankCode: string
): PermsRoleSchema {
  const isHighCommand = rankWeight >= 8;
  const isMinister = rankWeight >= 5;
  const isStaff = rankWeight >= 2;

  const permissions: PermsObject = {
    dashboard: {
      enabled: true,
    },
    'dashboard.servers': {
      enabled: isStaff,
      'dashboard.servers.[serverId]': {
        'rednecks-gaming': {
          enabled: isStaff,
          settings: { enabled: isHighCommand },
          botconfig: { enabled: isHighCommand },
          embeds: { enabled: rankWeight >= 3 },
          analytics: { enabled: isStaff },
        },
        'rednecks-administrative-center': {
          enabled: isHighCommand,
        },
      },
    },
    'dashboard.embeds': {
      enabled: rankWeight >= 3,
    },
    'dashboard.botconfig': {
      enabled: isHighCommand,
    },
    'dashboard.personnel': {
      enabled: rankWeight >= 3,
      'dashboard.personnel.roles': {
        enabled: rankWeight >= 3,
      },
      'dashboard.personnel.perms': {
        enabled: isHighCommand,
      },
    },
    'dashboard.whitelist': {
      enabled: isMinister,
      fullAccess: isHighCommand,
    },
    'dashboard.account': {
      enabled: true,
    },
  };

  return {
    title: '(Personnel) (Permission System)',
    metadata: {
      role_name: role.name,
      designation_id: designation.id,
      designation_name: designation.name,
      code: rankCode,
      weight: rankWeight,
      version: 1,
      last_modified_at: new Date().toISOString(),
    },
    permissions,
  };
}

export function buildDirectoryTree(
  ranks: MatrixRankItem[],
  designations: MatrixDesignationItem[],
  cells: Record<string, PopoverRoleItem[]>
): PermsFolderNode[] {
  const rankMap = new Map<number, string>();
  for (const rank of ranks) {
    rankMap.set(rank.weight, rank.code);
  }

  return designations.map((des) => {
    const files: PermsFileNode[] = [];
    const sortedRanks = [...ranks].sort((a, b) => b.weight - a.weight);

    for (const rank of sortedRanks) {
      const cellKey = `${rank.weight}_${des.id}`;
      const rolesInCell = cells[cellKey] || [];

      for (const role of rolesInCell) {
        const rankCode = rankMap.get(rank.weight) || `R${rank.weight}`;
        const schema = generateRoleSchema(role, des, rank.weight, rankCode);

        files.push({
          id: `${des.id}_${role.id}`,
          name: role.name,
          fileName: `${role.name}.json`,
          designationId: des.id,
          designationName: des.name,
          rankWeight: rank.weight,
          rankCode,
          schema,
        });
      }
    }

    return {
      id: des.id,
      name: des.name,
      files,
    };
  });
}

function setNested(target: PermsObject, path: string[], val: unknown): PermsObject {
  if (path.length === 0) return target;
  const [head, ...tail] = path;
  if (tail.length === 0) {
    return { ...target, [head]: val };
  }
  const child = (target[head] && typeof target[head] === 'object' ? target[head] : {}) as PermsObject;
  return {
    ...target,
    [head]: setNested(child, tail, val),
  };
}

export function updatePermissionAtPath(
  prevSchema: PermsRoleSchema,
  path: string[],
  value: boolean
): PermsRoleSchema {
  const nextPermissions = setNested(prevSchema.permissions, path, value);
  return {
    ...prevSchema,
    metadata: {
      ...prevSchema.metadata,
      version: (prevSchema.metadata.version || 1) + 1,
      last_modified_at: new Date().toISOString(),
    },
    permissions: nextPermissions,
  };
}
