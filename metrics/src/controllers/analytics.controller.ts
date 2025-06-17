import { Elysia } from 'elysia';
import { injectable, inject } from 'inversify';
import { MetricsService } from '../services/metrics.service';
import { subDays, isValid } from 'date-fns';
import { TYPES } from '../ioc/container';

const createRutes = () => {
    return new Elysia({ prefix: '/api/analytics' })
}

@injectable()
export class AnalyticsController {
  private router: ReturnType<typeof createRutes>;

  constructor(
    @inject(TYPES.MetricsService) private metricsService: MetricsService
  ) {
    this.router = createRutes();
    this.setupRoutes();
  }

  /**
   * Set up the analytics routes
   */
  private setupRoutes(): void {
    this.router.get('/temperature/latest', async () => {
      const result = await this.metricsService.getLatestTemperature();
      return result || { error: 'No temperature readings found' };
    });

    this.router.get('/temperature/range', async ({ query }) => {
      // Default to last 24 hours if no dates provided
      const end = query.end ? new Date(query.end) : new Date();
      const start = query.start 
        ? new Date(query.start) 
        : subDays(end, 1);

      if (!isValid(start) || !isValid(end)) {
        return { error: 'Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss.sssZ' };
      }

      const period = {
        start: start.toISOString(),
        end: end.toISOString()
      };

      const readings = (await this.metricsService.getTemperatureReadings(period)).slice(0, 5000); // Limit to 1000 readings for performance
      return { period, readings };
    });

    this.router.get('/alerts', async ({ query }) => {
      // Default to last 7 days if no dates provided
      const end = query.end ? new Date(query.end) : new Date();
      const start = query.start 
        ? new Date(query.start) 
        : subDays(end, 7);

      if (!isValid(start) || !isValid(end)) {
        return { error: 'Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss.sssZ' };
      }

      const period = {
        start: start.toISOString(),
        end: end.toISOString()
      };

      const alerts = await this.metricsService.getTemperatureAlerts(period);
      return { period, alerts };
    });

    this.router.get('/cooling', async ({ query }) => {
      // Default to last 7 days if no dates provided
      const end = query.end ? new Date(query.end) : new Date();
      const start = query.start 
        ? new Date(query.start) 
        : subDays(end, 7);

      if (!isValid(start) || !isValid(end)) {
        return { error: 'Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss.sssZ' };
      }

      const period = {
        start: start.toISOString(),
        end: end.toISOString()
      };

      const events = await this.metricsService.getCoolingEvents(period);
      return { period, events };
    });

    this.router.get('/statistics', async ({ query }) => {
      // Default to last 7 days if no dates provided
      const end = query.end ? new Date(query.end) : new Date();
      const start = query.start 
        ? new Date(query.start) 
        : subDays(end, 7);

      if (!isValid(start) || !isValid(end)) {
        return { error: 'Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss.sssZ' };
      }

      const period = {
        start: start.toISOString(),
        end: end.toISOString()
      };

      const statistics = await this.metricsService.getTemperatureStatistics(period);
      return statistics;
    });

    this.router.get('/hourly', async ({ query }) => {
      // Default to last 24 hours if no dates provided
      const end = query.end ? new Date(query.end) : new Date();
      const start = query.start 
        ? new Date(query.start) 
        : subDays(end, 1);

      if (!isValid(start) || !isValid(end)) {
        return { error: 'Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss.sssZ' };
      }

      const period = {
        start: start.toISOString(),
        end: end.toISOString()
      };

      const aggregates = await this.metricsService.getHourlyTemperatureAggregates(period);
      return { period, aggregates };
    });

    this.router.get('/daily', async ({ query }) => {
      // Default to last 30 days if no dates provided
      const end = query.end ? new Date(query.end) : new Date();
      const start = query.start 
        ? new Date(query.start) 
        : subDays(end, 30);

      if (!isValid(start) || !isValid(end)) {
        return { error: 'Invalid date format. Use ISO format: YYYY-MM-DDTHH:mm:ss.sssZ' };
      }

      const period = {
        start: start.toISOString(),
        end: end.toISOString()
      };

      const aggregates = await this.metricsService.getDailyTemperatureAggregates(period);
      return { period, aggregates };
    });
  }

  /**
   * Get the router instance
   */
  getRouter() {
    return this.router;
  }
}
