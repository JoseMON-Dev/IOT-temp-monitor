import 'reflect-metadata';
import { Elysia } from 'elysia';
import { ConfigService } from './services/config.service';
import { DatabaseService } from './database/database.service';
import { MetricsService } from './services/metrics.service';
import { MqttService } from './mqtt/mqtt.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { container, TYPES } from './ioc/container';
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { NotificationService } from './services/notification.service';
import { EventEmitterAsyncResource } from 'node:events';

// Configure IoC container bindings
container.bind<EventEmitterAsyncResource>(TYPES.MetricsEvnetEmitter).toConstantValue(new EventEmitterAsyncResource({name:"MetricsServer"}));
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
container.bind<DatabaseService>(TYPES.DatabaseService).to(DatabaseService).inSingletonScope();
container.bind<MetricsService>(TYPES.MetricsService).to(MetricsService).inSingletonScope();
container.bind<MqttService>(TYPES.MqttService).to(MqttService).inSingletonScope();
container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService).inSingletonScope();
container.bind<AnalyticsController>(TYPES.AnalyticsController).to(AnalyticsController).inSingletonScope();

// Get services from IoC container
const configService = container.get<ConfigService>(TYPES.ConfigService);
const mqttService = container.get<MqttService>(TYPES.MqttService);
const analyticsController = container.get<AnalyticsController>(TYPES.AnalyticsController);

// Initialize MQTT connection
mqttService.connect().catch(err => {
  console.error('Failed to connect to MQTT broker:', err);
});

// Create the API server
const app = new Elysia()
  .use(swagger())
  .use(analyticsController.getRouter())
  .ws('/ws', {
    message: (ws, message) => {
      ws.send(`Echo: ${message}`);
    },
    open: (ws) => {
      const emitter = container.get<EventEmitterAsyncResource>(TYPES.MetricsEvnetEmitter);
      emitter.on('temp_update', (temp) => {
        ws.send(JSON.stringify({ type: 'temp_update', data: temp }));
      })
      emitter.on('alert', (alert) => {
        ws.send(JSON.stringify({ type: 'alert', data: alert }));
      });
    }
  })
  .get('/', () => ({ 
    message: 'IoT Temperature Monitoring Metrics API', 
    version: '1.0.0',
    endpoints: [
      '/api/analytics/temperature/latest',
      '/api/analytics/temperature/range',
      '/api/analytics/alerts',
      '/api/analytics/cooling',
      '/api/analytics/statistics',
      '/api/analytics/hourly',
      '/api/analytics/daily'
    ]
  }))
  .use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  .listen(configService.getNumber('PORT'));

console.log(`🚀 Metrics server is running at ${app.server?.hostname}:${app.server?.port}`);

// Setup aggregation job to run every hour
const HOUR_IN_MS = 60 * 60 * 1000;
setInterval(() => {
  console.log('Running scheduled aggregations...');
  const metricsService = container.get<MetricsService>(TYPES.MetricsService);
  metricsService.runAggregations().catch((err: Error) => {
    console.error('Error running aggregations:', err);
  });
}, HOUR_IN_MS);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  
  // Disconnect MQTT
  await mqttService.disconnect();
  
  // Stop the server
  await app.stop();
  
  console.log('Server stopped');
  process.exit(0);
});

export default app;
