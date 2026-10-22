export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PartialEmojiObject {
  id?: string;
  name: string;
  animated?: boolean;
}

export interface DiscordEmojiData {
  id: string;
  name: string;
  animated: boolean;
  url: string;
  formatted: string;
}

export function getDiscordAvatarUrl(discordId?: string | null, avatarHash?: string | null): string {
  if (!discordId || !avatarHash || discordId === 'UNLINKED') {
    return '/assets/staff.png';
  }
  const ext = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}`;
}
