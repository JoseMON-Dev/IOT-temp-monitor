export interface TemperatureReading {
  id?: number;
  timestamp: string;
  temperature: number;
  humidity?: number;
}

export interface TemperatureAlert {
  id?: number;
  timestamp: string;
  temperature: number;
  duration?: number; // in seconds
  maxTemperature?: number;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface SystemStatus {
  id?: number;
  timestamp: string;
  uptime: number; // in hours
  wifiSignalStrength?: number; // in dBm
  mqttConnected: boolean;
}

export interface CoolingEvent {
  id?: number;
  timestamp: string;
  activatedAt: string;
  deactivatedAt?: string;
  duration?: number; // in seconds
  triggerType: 'auto' | 'manual';
}

export interface AggregatedTemperature {
  id?: number;
  date: string;
  hour?: number;
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity?: number;
  minHumidity?: number;
  maxHumidity?: number;
  readingsCount: number;
}

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

