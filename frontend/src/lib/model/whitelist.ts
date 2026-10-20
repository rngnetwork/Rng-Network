export type PersonnelRank =
  | 'ROLE_CHIEF_HIGH_COMMAND'
  | 'ROLE_HIGH_COMMAND'
  | 'ROLE_MINISTER'
  | 'ROLE_USER';

export type MinistryType =
  | 'MINISTRY_OF_WAR'
  | 'MINISTRY_OF_DEFENSE'
  | 'MINISTRY_OF_FOREIGN_AFFAIRS'
  | 'MINISTRY_OF_INTERNAL_AFFAIRS'
  | 'MINISTRY_OF_MEDIA_COMMUNICATIONS'
  | 'MINISTRY_OF_TREASURY_COMMERCE';

export interface WhitelistedUser {
  id: number;
  email: string;
  userName: string;
  provider: string;
  role: string;
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
