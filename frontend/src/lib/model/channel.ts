export type DiscordChannelType = 0 | 2 | 4 | 5 | 10 | 11 | 12 | 13 | 15;

export interface ChannelItem {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId: string | null;
}
