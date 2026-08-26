export interface ServerData {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  banner: string;
  color: string;
  onlineCount: string;
  totalCount: string;
  status: 'operational' | 'degraded' | 'offline';
  botConnected: boolean;
  prefix: string;
  locale: string;
  welcomeChannel: string;
  boostLevel: number; // 0, 1, 2, 3
  boostCount: number;
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
    prefix: "!",
    locale: "English (US)",
    welcomeChannel: "#welcome",
    boostLevel: 2,
    boostCount: 14
  },
  {
    id: "rng-rivals",
    name: "RNG Rivals",
    shortName: "RR",
    description: "Competitive Esports, Tournaments & Ranked Ladders for community gladiators.",
    icon: "/visuals/MAIN_LOGO.png",
    banner: "/visuals/apocalyptic_battlefield_bg.jpg",
    color: "#991B1B",
    onlineCount: "890",
    totalCount: "2,640",
    status: "operational",
    botConnected: true,
    prefix: "?",
    locale: "English (US)",
    welcomeChannel: "#announcements",
    boostLevel: 1,
    boostCount: 7
  },
  {
    id: "rng-roughnuts",
    name: "RNG Roughnuts",
    shortName: "RN",
    description: "Community Sanctuary · Events, Voice Hubs & Casual Hangouts.",
    icon: "/visuals/LOGO_FOR_STAFFS.png",
    banner: "",
    color: "#7F1D1D",
    onlineCount: "560",
    totalCount: "1,920",
    status: "operational",
    botConnected: true,
    prefix: ".",
    locale: "English (US)",
    welcomeChannel: "#lounge",
    boostLevel: 0,
    boostCount: 1
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
