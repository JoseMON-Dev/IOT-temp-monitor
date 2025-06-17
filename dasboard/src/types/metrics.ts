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

export interface CoolingEvent {
  id?: number;
  timestamp: string;
  activated_at: string;
  deactivated_at?: string;
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

export interface TemperatureStatistics {
    alerts:{
        averageDuration: number;
        resolved: number;
        total: number;
    }
    cooling: {
        automatic: number;
        averageDuration: number;
        manual: number;
        total: number;
    },
    humidity: {
        average: number;
    },
    period: {
        start: string;
        end: string;
    },
    temperature: {
        average: number;
        maximum: number;
        minimum: number;
        readingCount: number;
    },
    threshold:{
        timeAbove: number;
        value: number;
    }
}

export interface ApiResponse<T> {
  period?: AnalyticsPeriod;
  readings?: T[];
  alerts?: TemperatureAlert[];
  events?: CoolingEvent[];
  aggregates?: AggregatedTemperature[];
  error?: string;
}
