export interface UserProfileData {
  id: number;
  email: string;
  fullName?: string;
  provider?: string;
  role: string;
  designations?: string;
  roles?: string;
  designationList?: string[];
  roleList?: string[];
  status?: string;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordLinked: boolean;
}

export interface AccountPreferences {
  emailNotifications: boolean;
  discordDmAlerts: boolean;
  compactTables: boolean;
  defaultTimezone: string;
}

export interface ActiveSessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
}
