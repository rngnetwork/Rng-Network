export interface ServerTrait {
  emoji?: string;
  name: string;
}

export interface ServerData {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  banner: string;
  bannerColor?: string;
  color: string;
  onlineCount: string;
  totalCount: string;
  status: 'operational' | 'degraded' | 'offline';
  botConnected: boolean;
  welcomeChannel: string;
  afkChannel?: string;
  afkTimeout?: string;
  boostLevel: number; // 0, 1, 2, 3
  boostCount: number;

  /**
   * Discord Server Traits (Up to 5 server tags / traits with custom emoji & text)
   * e.g. [{ emoji: "🎮", name: "Gaming" }, { emoji: "🏆", name: "Competitive" }]
   */
  traits: ServerTrait[];

  /**
   * Discord Activity Feed Settings
   * Shows a feed of activity from games and connected apps in this server.
   */
  activityFeedEnabled: boolean;

  /**
   * Discord Server Privacy Settings
   * When enabled, hides this server from public discovery, member lists, and discovery feeds.
   */
  privateProfile: boolean;
}

export const MOCK_SERVERS: ServerData[] = [
  {
    id: "rednecks-gaming",
    name: "Rednecks Gaming",
    shortName: "RG",
    description: "Main Headquarters · Core Gaming & Operations Hub for RNG Network personnel.",
    icon: "/visuals/owner.jpg",
    banner: "/visuals/RNG_Bannerr.gif",
    color: "#E11D2E",
    onlineCount: "1,420",
    totalCount: "4,850",
    status: "operational",
    botConnected: true,
    welcomeChannel: "#welcome",
    afkChannel: "🔊 #afk-lounge",
    afkTimeout: "15 minutes",
    bannerColor: "#E11D2E",
    boostLevel: 2,
    boostCount: 14,
    traits: [
      { emoji: "🎮", name: "Gaming" },
      { emoji: "🏆", name: "Competitive" },
      { emoji: "⚡", name: "Esports" },
      { emoji: "⚔️", name: "Tournaments" },
      { emoji: "🤝", name: "Community" }
    ],
    activityFeedEnabled: true,
    privateProfile: false
  },
  {
    id: "rng-rivals",
    name: "RNG Rivals",
    shortName: "RR",
    description: "Competitive Esports, Tournaments & Ranked Ladders for community gladiators.",
    icon: "/visuals/RNG_MAIN_LOGO_TRANSPARENT.png",
    banner: "/visuals/apocalyptic_battlefield_bg.jpg",
    color: "#991B1B",
    onlineCount: "890",
    totalCount: "2,640",
    status: "operational",
    botConnected: true,
    welcomeChannel: "#announcements",
    afkChannel: "No Inactive Channel",
    afkTimeout: "5 minutes",
    bannerColor: "#991B1B",
    boostLevel: 1,
    boostCount: 7,
    traits: [
      { emoji: "⚡", name: "Esports" },
      { emoji: "🏆", name: "Competitive" },
      { emoji: "⚔️", name: "Tournaments" },
      { emoji: "🛡️", name: "Clans / Guilds" }
    ],
    activityFeedEnabled: true,
    privateProfile: false
  },
  {
    id: "rng-roughnuts",
    name: "RNG Roughnuts",
    shortName: "RN",
    description: "Community Sanctuary · Events, Voice Hubs & Casual Hangouts.",
    icon: "/visuals/LOGO_FOR_STAFFS.png",
    banner: "/visuals/apocalyptic_battlefield_bg.jpg",
    color: "#7F1D1D",
    onlineCount: "560",
    totalCount: "1,920",
    status: "operational",
    botConnected: true,
    welcomeChannel: "#lounge",
    afkChannel: "🔊 #voice-inactive",
    afkTimeout: "30 minutes",
    bannerColor: "#7F1D1D",
    boostLevel: 0,
    boostCount: 1,
    traits: [
      { emoji: "☕", name: "Casual" },
      { emoji: "🤝", name: "Community" },
      { emoji: "🎉", name: "Events" },
      { emoji: "💬", name: "Social" },
      { emoji: "🎮", name: "Gaming" }
    ],
    activityFeedEnabled: false,
    privateProfile: true
  }
];

export const mockServersApi = {
  /**
   * Fetch all servers where the RNG Bot is linked and authorized.
   * Easily replaceable by backend dev: fetch(`${API_BASE}/api/v1/servers`)
   */
  async getConnectedServers(): Promise<ServerData[]> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_SERVERS;
  },

  /**
   * Fetch specific server configuration by ID.
   */
  async getServerById(id: string): Promise<ServerData | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return MOCK_SERVERS.find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase()) || null;
  },

  /**
   * Mock save server settings
   */
  async updateServerSettings(id: string, updates: Partial<ServerData>): Promise<{ success: boolean; data: ServerData }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const server = MOCK_SERVERS.find((s) => s.id === id);
    if (!server) throw new Error("Server not found");
    Object.assign(server, updates);
    return { success: true, data: server };
  }
};
