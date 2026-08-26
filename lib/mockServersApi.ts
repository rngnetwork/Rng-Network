export interface ServerData {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  onlineCount: string;
  totalCount: string;
  status: 'operational' | 'degraded' | 'offline';
  botConnected: boolean;
  prefix?: string;
  locale?: string;
  welcomeChannel?: string;
}

export const MOCK_SERVERS: ServerData[] = [
  {
    id: "rednecks-gaming",
    name: "Rednecks Gaming",
    shortName: "RG",
    description: "Main Headquarters · Core Gaming & Operations Hub",
    icon: "/visuals/owner.jpg",
    color: "#E11D2E",
    onlineCount: "1,420",
    totalCount: "4,850",
    status: "operational",
    botConnected: true,
    prefix: "!",
    locale: "English (US)",
    welcomeChannel: "#welcome"
  },
  {
    id: "rng-rivals",
    name: "RNG Rivals",
    shortName: "RR",
    description: "Competitive Esports, Tournaments & Ranked Ladders",
    icon: "/visuals/MAIN_LOGO.png",
    color: "#991B1B",
    onlineCount: "890",
    totalCount: "2,640",
    status: "operational",
    botConnected: true,
    prefix: "?",
    locale: "English (US)",
    welcomeChannel: "#announcements"
  },
  {
    id: "rng-roughnuts",
    name: "RNG Roughnuts",
    shortName: "RN",
    description: "Community Sanctuary · Events, Voice Hubs & Hangouts",
    icon: "/visuals/LOGO_FOR_STAFFS.png",
    color: "#7F1D1D",
    onlineCount: "560",
    totalCount: "1,920",
    status: "operational",
    botConnected: true,
    prefix: ".",
    locale: "English (US)",
    welcomeChannel: "#lounge"
  }
];

export const mockServersApi = {
  /**
   * Fetch all servers where the RNG Bot is linked and authorized.
   * Easily replaceable by backend dev: fetch(`${API_BASE}/api/v1/servers`)
   */
  async getConnectedServers(): Promise<ServerData[]> {
    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 350));
    return MOCK_SERVERS;
  },

  /**
   * Fetch specific server configuration by ID.
   */
  async getServerById(id: string): Promise<ServerData | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_SERVERS.find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase()) || null;
  }
};
