import axios from 'axios';
import type { 
  TemperatureReading, 
  TemperatureAlert, 
  CoolingEvent,
  AggregatedTemperature,
  TemperatureStatistics,
  ApiResponse
} from '../types/metrics';

// Configure the base URL for the API
// This should be provided through environment variables in a real application
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/analytics';

class MetricsService {
  /**
   * Get the latest temperature reading
   */
  async getLatestTemperature(): Promise<TemperatureReading | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/temperature/latest`);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest temperature:', error);
      return null;
    }
  }

  /**
   * Get temperature readings for a given time period
   */
  async getTemperatureRange(
    start: string | Date,
    end: string | Date
  ): Promise<ApiResponse<TemperatureReading>> {
    try {
      const startIso = start instanceof Date ? start.toISOString() : start;
      const endIso = end instanceof Date ? end.toISOString() : end;
      
      const response = await axios.get(
        `${API_BASE_URL}/temperature/range?start=${startIso}&end=${endIso}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching temperature range:', error);
      return { error: 'Failed to fetch temperature range' };
    }
  }

  /**
   * Get temperature alerts for a given time period
   */
  async getAlerts(
    start: string | Date,
    end: string | Date
  ): Promise<ApiResponse<TemperatureAlert>> {
    try {
      const startIso = start instanceof Date ? start.toISOString() : start;
      const endIso = end instanceof Date ? end.toISOString() : end;
      
      const response = await axios.get(
        `${API_BASE_URL}/alerts?start=${startIso}&end=${endIso}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching temperature alerts:', error);
      return { error: 'Failed to fetch temperature alerts' };
    }
  }

  /**
   * Get cooling events for a given time period
   */
  async getCoolingEvents(
    start: string | Date,
    end: string | Date
  ): Promise<ApiResponse<CoolingEvent>> {
    try {
      const startIso = start instanceof Date ? start.toISOString() : start;
      const endIso = end instanceof Date ? end.toISOString() : end;
      
      const response = await axios.get(
        `${API_BASE_URL}/cooling?start=${startIso}&end=${endIso}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching cooling events:', error);
      return { error: 'Failed to fetch cooling events' };
    }
  }

  /**
   * Get temperature statistics for a given time period
   */
  async getStatistics(
    start: string | Date,
    end: string | Date
  ): Promise<TemperatureStatistics | null> {
    try {
      const startIso = start instanceof Date ? start.toISOString() : start;
      const endIso = end instanceof Date ? end.toISOString() : end;
      
      const response = await axios.get(
        `${API_BASE_URL}/statistics?start=${startIso}&end=${endIso}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching temperature statistics:', error);
      return null;
    }
  }

  /**
   * Get hourly temperature aggregates for a given time period
   */
  async getHourlyAggregates(
    start: string | Date,
    end: string | Date
  ): Promise<ApiResponse<AggregatedTemperature>> {
    try {
      const startIso = start instanceof Date ? start.toISOString() : start;
      const endIso = end instanceof Date ? end.toISOString() : end;
      
      const response = await axios.get(
        `${API_BASE_URL}/hourly?start=${startIso}&end=${endIso}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching hourly temperature aggregates:', error);
      return { error: 'Failed to fetch hourly temperature aggregates' };
    }
  }

  /**
   * Get daily temperature aggregates for a given time period
   */
  async getDailyAggregates(
    start: string | Date,
    end: string | Date
  ): Promise<ApiResponse<AggregatedTemperature>> {
    try {
      const startIso = start instanceof Date ? start.toISOString() : start;
      const endIso = end instanceof Date ? end.toISOString() : end;
      
      const response = await axios.get(
        `${API_BASE_URL}/daily?start=${startIso}&end=${endIso}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching daily temperature aggregates:', error);
      return { error: 'Failed to fetch daily temperature aggregates' };
    }
  }
}

// Export a singleton instance
export const metricsService = new MetricsService();
