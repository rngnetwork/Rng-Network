export interface AnalyticsMetricPoint {
  date: string;
  dispatches: number;
  interactions: number;
  errors: number;
}

export interface DashboardStats {
  totalManagedServers: number;
  totalWhitelistedPersonnel: number;
  totalTemplatesSaved: number;
  totalDispatches24h: number;
  gatewayStatus: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
  averageLatencyMs: number;
}

export interface ServerAnalyticsData {
  serverId: string;
  totalDispatches: number;
  totalInteractions: number;
  successRatePercent: number;
  averageLatencyMs: number;
  activeActionTemplates: number;
  series: AnalyticsMetricPoint[];
}
