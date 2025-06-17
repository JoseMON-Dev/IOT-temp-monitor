import { injectable, inject } from 'inversify';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from './config.service';
import { TYPES } from '../ioc/container';
import type {
  TemperatureReading,
  TemperatureAlert,
  CoolingEvent,
  AggregatedTemperature,
  AnalyticsPeriod
} from '../models/metrics.model';
import { format, subDays, subHours, parseISO } from 'date-fns';
import { NotificationService } from './notification.service';
import { EventEmitterAsyncResource } from 'events';
import { te, th } from 'date-fns/locale';

@injectable()
export class MetricsService {
  private currentTemperature: number = 0;
  private currentHumidity: number = 0;
  private alertActive: boolean = false;
  private alertStartTime: string | null = null;
  private maxAlertTemperature: number = 0;
  private coolingActive: boolean = false;
  private coolingStartTime: string | null = null;
  private coolingTriggerType: 'auto' | 'manual' = 'auto';

  constructor(
    @inject(TYPES.DatabaseService) private db: DatabaseService,
    @inject(TYPES.ConfigService) private configService: ConfigService,
    @inject(TYPES.NotificationService) private notificationService: NotificationService,
    @inject(TYPES.MetricsEvnetEmitter) private eventEmitter: EventEmitterAsyncResource
  ) {}

  /**
   * Record a temperature reading
   */
  recordTemperature(temperature: number): void {
    const timestamp = new Date().toISOString();
    this.currentTemperature = temperature;
    
    // Store in database
    const reading: TemperatureReading = {
      timestamp,
      temperature,
      humidity: this.currentHumidity
    };
    
    this.storeTemperatureReading(reading);
    
    // Check for alert condition
    const threshold = this.configService.getNumber('ALERT_THRESHOLD');
    
    if (temperature > threshold && !this.alertActive) {
      this.startAlert(temperature, timestamp);
    }
    else if (temperature <= threshold && this.alertActive) {
      this.endAlert(timestamp);
    }
    else if (temperature > threshold && this.alertActive) {
      // Update max temperature during the alert
      if (temperature > this.maxAlertTemperature) {
        this.maxAlertTemperature = temperature;
      }
    }
  }
  
  /**
   * Record a humidity reading
   */
  recordHumidity(humidity: number): void {
    this.currentHumidity = humidity;
    // We only save humidity alongside temperature readings
    // to reduce database writes and keep them paired
  }
  
  /**
   * Record an alert state change
   */
  recordAlert(isActive: boolean): void {
    const timestamp = new Date().toISOString();
    
    if (isActive && !this.alertActive) {
      this.startAlert(this.currentTemperature, timestamp);
      this.eventEmitter.emit('alert', {
        temperature: this.currentTemperature,
        timestamp
      });
    }
    else if (!isActive && this.alertActive) {
      this.endAlert(timestamp);
    }
  }
  
  /**
   * Start tracking an alert
   */
  private startAlert(temperature: number, timestamp: string): void {
    this.alertActive = true;
    this.alertStartTime = timestamp;
    this.maxAlertTemperature = temperature;
    
    // Create an open alert record
    const alert: TemperatureAlert = {
      timestamp,
      temperature,
      resolved: false
    };
    
    this.storeAlert(alert);
    
    console.log(`Alert started at ${timestamp} with temperature ${temperature}°C`);
    
    // Send notification
    this.sendTemperatureAlert(temperature, timestamp);
  }
  
  /**
   * Send temperature alert notifications via SMS
   */
  private async sendTemperatureAlert(temperature: number, timestamp: string): Promise<void> {
    try {
      const phoneNumber = this.configService.get('ALERT_PHONE_NUMBER');
      const locationName = 'IoT Sensor';
      const formattedTime = new Date(timestamp).toLocaleString();
      
      // Only proceed if phone number is configured
      if (!phoneNumber) {
        console.log('No alert phone number configured, skipping SMS notification');
        return;
      }
      
      const message = `ALERT: High temperature of ${temperature.toFixed(1)}°C detected at ${locationName} at ${formattedTime}.`;
      
      // Send SMS notification
      await this.notificationService.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('Failed to send SMS alert notification:', error);
    }
  }
  
  /**
   * End tracking an alert
   */
  private endAlert(timestamp: string): void {
    if (!this.alertActive || !this.alertStartTime) {
      return;
    }
    
    const duration = this.calculateDurationInSeconds(
      this.alertStartTime,
      timestamp
    );
    
    // Update the alert record
    this.updateAlertResolution(
      this.alertStartTime,
      timestamp,
      duration,
      this.maxAlertTemperature
    );
    
    this.alertActive = false;
    this.alertStartTime = null;
    this.maxAlertTemperature = 0;
    
    console.log(`Alert ended at ${timestamp}, duration: ${duration} seconds`);
  }
  
  /**
   * Record a cooling system state change
   */
  recordCoolingEvent(isActive: boolean, triggerType: 'auto' | 'manual'): void {
    const timestamp = new Date().toISOString();
    
    if (isActive && !this.coolingActive) {
      // Start cooling event
      this.coolingActive = true;
      this.coolingStartTime = timestamp;
      this.coolingTriggerType = triggerType;
      
      // Record start of cooling event
      const event: CoolingEvent = {
        timestamp,
        activatedAt: timestamp,
        triggerType
      };
      
      this.storeCoolingEvent(event);
      console.log(`Cooling activated at ${timestamp}, trigger: ${triggerType}`);
    }
    else if (!isActive && this.coolingActive && this.coolingStartTime) {
      // End cooling event
      const duration = this.calculateDurationInSeconds(
        this.coolingStartTime,
        timestamp
      );
      
      // Update the cooling event
      this.updateCoolingEventResolution(
        this.coolingStartTime,
        timestamp,
        duration
      );
      
      this.coolingActive = false;
      this.coolingStartTime = null;
      
      console.log(`Cooling deactivated at ${timestamp}, duration: ${duration} seconds`);
    }
  }
  
  /**
   * Store a temperature reading in the database
   */
  private storeTemperatureReading(reading: TemperatureReading): void {
    try {
      this.eventEmitter.emit('temp_update', {
        temperature: reading.temperature,
        humidity: reading.humidity,
        timestamp: reading.timestamp
      });
      this.db.run(
        `INSERT INTO temperature_readings (timestamp, temperature, humidity)
         VALUES (?, ?, ?)`,
        [reading.timestamp, reading.temperature, reading.humidity]
      );
    } catch (error) {
      console.error('Error storing temperature reading:', error);
    }
  }
  
  /**
   * Store an alert in the database
   */
  private storeAlert(alert: TemperatureAlert): void {
    try {
      this.db.run(
        `INSERT INTO temperature_alerts 
         (timestamp, temperature, resolved)
         VALUES (?, ?, ?)`,
        [alert.timestamp, alert.temperature, alert.resolved ? 1 : 0]
      );
    } catch (error) {
      console.error('Error storing temperature alert:', error);
    }
  }
  
  /**
   * Update an alert resolution in the database
   */
  private updateAlertResolution(
    startTime: string,
    endTime: string,
    duration: number,
    maxTemperature: number
  ): void {
    try {
      this.db.run(
        `UPDATE temperature_alerts 
         SET resolved = 1, 
             resolved_at = ?, 
             duration = ?, 
             max_temperature = ?
         WHERE timestamp = ?`,
        [endTime, duration, maxTemperature, startTime]
      );
    } catch (error) {
      console.error('Error updating alert resolution:', error);
    }
  }
  
  /**
   * Store a cooling event in the database
   */
  private storeCoolingEvent(event: CoolingEvent): void {
    try {
      this.db.run(
        `INSERT INTO cooling_events 
         (timestamp, activated_at, trigger_type)
         VALUES (?, ?, ?)`,
        [event.timestamp, event.activatedAt, event.triggerType]
      );
    } catch (error) {
      console.error('Error storing cooling event:', error);
    }
  }
  
  /**
   * Update a cooling event resolution in the database
   */
  private updateCoolingEventResolution(
    startTime: string,
    endTime: string,
    duration: number
  ): void {
    try {
      this.db.run(
        `UPDATE cooling_events 
         SET deactivated_at = ?, 
             duration = ?
         WHERE activated_at = ?`,
        [endTime, duration, startTime]
      );
    } catch (error) {
      console.error('Error updating cooling event resolution:', error);
    }
  }
  
  /**
   * Calculate the duration between two ISO timestamps in seconds
   */
  private calculateDurationInSeconds(startTime: string, endTime: string): number {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.round((end - start) / 1000);
  }
  
  /**
   * Run aggregation tasks to summarize data
   * This should be called periodically, e.g., via a cron job
   */
  async runAggregations(): Promise<void> {
    try {
      await this.aggregateHourlyTemperature();
      await this.aggregateDailyTemperature();
    } catch (error) {
      console.error('Error running aggregations:', error);
    }
  }
  
  /**
   * Aggregate temperature readings by hour
   */
  private async aggregateHourlyTemperature(): Promise<void> {
    const now = new Date();
    const oneDayAgo = subHours(now, 24);
    const dateStr = format(oneDayAgo, 'yyyy-MM-dd');
    
    try {
      // For each hour in the last day, aggregate data
      for (let hour = 0; hour <= 23; hour++) {
        // Check if we already have an aggregation for this hour
        const existing = this.db.get<any>(
          `SELECT id FROM hourly_temperature_agg 
           WHERE date = ? AND hour = ?`,
          [dateStr, hour]
        );
        
        if (existing) {
          continue; // Skip if already aggregated
        }
        
        // Format the start and end of the hour
        const hourStart = new Date(
          oneDayAgo.getFullYear(),
          oneDayAgo.getMonth(),
          oneDayAgo.getDate(),
          hour,
          0,
          0
        ).toISOString();
        
        const hourEnd = new Date(
          oneDayAgo.getFullYear(),
          oneDayAgo.getMonth(),
          oneDayAgo.getDate(),
          hour,
          59,
          59,
          999
        ).toISOString();
        
        // Get the aggregated data
        const result = this.db.get<any>(
          `SELECT 
             COUNT(*) as count,
             AVG(temperature) as avg_temp,
             MIN(temperature) as min_temp,
             MAX(temperature) as max_temp,
             AVG(humidity) as avg_hum,
             MIN(humidity) as min_hum,
             MAX(humidity) as max_hum
           FROM temperature_readings
           WHERE timestamp >= ? 
             AND timestamp <= ?`,
          [hourStart, hourEnd]
        );
        
        if (result && result.count > 0) {
          // Insert the aggregation
          this.db.run(
            `INSERT INTO hourly_temperature_agg
             (date, hour, avg_temperature, min_temperature, max_temperature,
              avg_humidity, min_humidity, max_humidity, readings_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              dateStr,
              hour,
              result.avg_temp,
              result.min_temp,
              result.max_temp,
              result.avg_hum,
              result.min_hum,
              result.max_hum,
              result.count
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error aggregating hourly temperature:', error);
    }
  }
  
  /**
   * Aggregate temperature readings by day
   */
  private async aggregateDailyTemperature(): Promise<void> {
    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    const dateStr = format(oneDayAgo, 'yyyy-MM-dd');
    
    try {
      // Check if we already have an aggregation for this day
      const existing = this.db.get<any>(
        `SELECT id FROM daily_temperature_agg 
         WHERE date = ?`,
        [dateStr]
      );
      
      if (existing) {
        return; // Skip if already aggregated
      }
      
      // Format the start and end of the day
      const dayStart = new Date(
        oneDayAgo.getFullYear(),
        oneDayAgo.getMonth(),
        oneDayAgo.getDate(),
        0,
        0,
        0
      ).toISOString();
      
      const dayEnd = new Date(
        oneDayAgo.getFullYear(),
        oneDayAgo.getMonth(),
        oneDayAgo.getDate(),
        23,
        59,
        59,
        999
      ).toISOString();
      
      // Get the aggregated temperature data
      const tempResult = this.db.get<any>(
        `SELECT 
           COUNT(*) as count,
           AVG(temperature) as avg_temp,
           MIN(temperature) as min_temp,
           MAX(temperature) as max_temp,
           AVG(humidity) as avg_hum,
           MIN(humidity) as min_hum,
           MAX(humidity) as max_hum
         FROM temperature_readings
         WHERE timestamp >= ? 
           AND timestamp <= ?`,
        [dayStart, dayEnd]
      );
      
      // Get alerts count
      const alertsResult = this.db.get<any>(
        `SELECT COUNT(*) as count
         FROM temperature_alerts
         WHERE timestamp >= ? 
           AND timestamp <= ?`,
        [dayStart, dayEnd]
      );
      
      // Get cooling events count
      const coolingResult = this.db.get<any>(
        `SELECT COUNT(*) as count
         FROM cooling_events
         WHERE timestamp >= ? 
           AND timestamp <= ?`,
        [dayStart, dayEnd]
      );
      
      if (tempResult && tempResult.count > 0) {
        // Insert the daily aggregation
        this.db.run(
          `INSERT INTO daily_temperature_agg
           (date, avg_temperature, min_temperature, max_temperature,
            avg_humidity, min_humidity, max_humidity, 
            readings_count, alerts_count, cooling_events_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dateStr,
            tempResult.avg_temp,
            tempResult.min_temp,
            tempResult.max_temp,
            tempResult.avg_hum,
            tempResult.min_hum,
            tempResult.max_hum,
            tempResult.count,
            alertsResult ? alertsResult.count : 0,
            coolingResult ? coolingResult.count : 0
          ]
        );
      }
    } catch (error) {
      console.error('Error aggregating daily temperature:', error);
    }
  }
  
  // Analytics Methods
  
  /**
   * Get the latest temperature reading
   */
  getLatestTemperature(): Promise<TemperatureReading | null> {
    try {
      return Promise.resolve(this.db.get<TemperatureReading>(
        `SELECT * FROM temperature_readings
         ORDER BY timestamp DESC
         LIMIT 1`
      ));
    } catch (error) {
      console.error('Error getting latest temperature:', error);
      return Promise.resolve(null);
    }
  }
  
  /**
   * Get temperature readings for a specific time range
   */
  getTemperatureReadings(
    period: AnalyticsPeriod
  ): Promise<TemperatureReading[]> {
    try {
      return Promise.resolve(this.db.query<TemperatureReading>(
        `SELECT * FROM temperature_readings
         WHERE timestamp >= ?
           AND timestamp <= ?
         ORDER BY timestamp ASC`,
        [period.start, period.end]
      ));
    } catch (error) {
      console.error('Error getting temperature readings:', error);
      return Promise.resolve([]);
    }
  }
  
  /**
   * Get temperature alerts for a specific time range
   */
  getTemperatureAlerts(
    period: AnalyticsPeriod
  ): Promise<TemperatureAlert[]> {
    try {
      return Promise.resolve(this.db.query<TemperatureAlert>(
        `SELECT * FROM temperature_alerts
         WHERE timestamp >= ?
           AND timestamp <= ?
         ORDER BY timestamp ASC`,
        [period.start, period.end]
      ));
    } catch (error) {
      console.error('Error getting temperature alerts:', error);
      return Promise.resolve([]);
    }
  }
  
  /**
   * Get cooling events for a specific time range
   */
  getCoolingEvents(
    period: AnalyticsPeriod
  ): Promise<CoolingEvent[]> {
    try {
      return Promise.resolve(this.db.query<CoolingEvent>(
        `SELECT * FROM cooling_events
         WHERE timestamp >= ?
           AND timestamp <= ?
         ORDER BY timestamp ASC`,
        [period.start, period.end]
      ));
    } catch (error) {
      console.error('Error getting cooling events:', error);
      return Promise.resolve([]);
    }
  }
  
  /**
   * Get hourly temperature aggregates for a specific time range
   */
  getHourlyTemperatureAggregates(
    period: AnalyticsPeriod
  ): Promise<AggregatedTemperature[]> {
    try {
      return Promise.resolve(this.db.query<AggregatedTemperature>(
        `SELECT 
           id,
           date,
           hour,
           avg_temperature as avgTemperature,
           min_temperature as minTemperature,
           max_temperature as maxTemperature,
           avg_humidity as avgHumidity,
           min_humidity as minHumidity,
           max_humidity as maxHumidity,
           readings_count as readingsCount
         FROM hourly_temperature_agg
         WHERE date >= ?
           AND date <= ?
         ORDER BY date ASC, hour ASC`,
        [
          format(parseISO(period.start), 'yyyy-MM-dd'),
          format(parseISO(period.end), 'yyyy-MM-dd')
        ]
      ));
    } catch (error) {
      console.error('Error getting hourly temperature aggregates:', error);
      return Promise.resolve([]);
    }
  }
  
  /**
   * Get daily temperature aggregates for a specific time range
   */
  getDailyTemperatureAggregates(
    period: AnalyticsPeriod
  ): Promise<AggregatedTemperature[]> {
    try {
      return Promise.resolve(this.db.query<AggregatedTemperature>(
        `SELECT 
           id,
           date,
           avg_temperature as avgTemperature,
           min_temperature as minTemperature,
           max_temperature as maxTemperature,
           avg_humidity as avgHumidity,
           min_humidity as minHumidity,
           max_humidity as maxHumidity,
           readings_count as readingsCount
         FROM daily_temperature_agg
         WHERE date >= ?
           AND date <= ?
         ORDER BY date ASC`,
        [
          format(parseISO(period.start), 'yyyy-MM-dd'),
          format(parseISO(period.end), 'yyyy-MM-dd')
        ]
      ));
    } catch (error) {
      console.error('Error getting daily temperature aggregates:', error);
      return Promise.resolve([]);
    }
  }
  
  /**
   * Get temperature statistics for a time range
   */
  async getTemperatureStatistics(
    period: AnalyticsPeriod
  ): Promise<any> {
    try {
      // Get aggregate statistics
      const stats = this.db.get<any>(
        `SELECT 
           AVG(temperature) as avg_temp,
           MIN(temperature) as min_temp,
           MAX(temperature) as max_temp,
           AVG(humidity) as avg_humidity,
           COUNT(*) as readings_count
         FROM temperature_readings
         WHERE timestamp >= ?
           AND timestamp <= ?`,
        [period.start, period.end]
      );
      
      // Get alert counts
      const alerts = this.db.get<any>(
        `SELECT 
           COUNT(*) as total_alerts,
           SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolved_alerts,
           AVG(duration) as avg_duration
         FROM temperature_alerts
         WHERE timestamp >= ?
           AND timestamp <= ?`,
        [period.start, period.end]
      );
      
      // Get cooling event counts
      const cooling = this.db.get<any>(
        `SELECT 
           COUNT(*) as total_events,
           SUM(CASE WHEN trigger_type = 'auto' THEN 1 ELSE 0 END) as auto_events,
           SUM(CASE WHEN trigger_type = 'manual' THEN 1 ELSE 0 END) as manual_events,
           AVG(duration) as avg_duration
         FROM cooling_events
         WHERE timestamp >= ?
           AND timestamp <= ?`,
        [period.start, period.end]
      );
      
      // Calculate time above threshold
      const timeAboveThreshold = this.calculateTimeAboveThreshold(period);
      
      return {
        period: {
          start: period.start,
          end: period.end
        },
        temperature: {
          average: stats ? stats.avg_temp : 0,
          minimum: stats ? stats.min_temp : 0,
          maximum: stats ? stats.max_temp : 0,
          readingsCount: stats ? stats.readings_count : 0
        },
        humidity: {
          average: stats ? stats.avg_humidity : 0
        },
        alerts: {
          total: alerts ? alerts.total_alerts : 0,
          resolved: alerts ? alerts.resolved_alerts : 0,
          averageDuration: alerts ? alerts.avg_duration : 0
        },
        cooling: {
          total: cooling ? cooling.total_events : 0,
          automatic: cooling ? cooling.auto_events : 0,
          manual: cooling ? cooling.manual_events : 0,
          averageDuration: cooling ? cooling.avg_duration : 0
        },
        threshold: {
          value: this.configService.getNumber('ALERT_THRESHOLD'),
          timeAbove: timeAboveThreshold
        }
      };
    } catch (error) {
      console.error('Error getting temperature statistics:', error);
      return {};
    }
  }
  
  /**
   * Calculate the total time the temperature was above threshold
   */
  private calculateTimeAboveThreshold(
    period: AnalyticsPeriod
  ): number {
    try {
      const alerts = this.db.query<TemperatureAlert>(
        `SELECT 
           timestamp,
           resolved_at,
           duration
         FROM temperature_alerts
         WHERE timestamp >= ?
           AND timestamp <= ?
           AND resolved = 1`,
        [period.start, period.end]
      );
      
      // Sum up the durations of all resolved alerts
      return alerts.reduce((total, alert) => {
        return total + (alert.duration || 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating time above threshold:', error);
      return 0;
    }
  }
}
