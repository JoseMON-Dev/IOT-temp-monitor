import "reflect-metadata";
import { Container } from "inversify";
import { interfaces } from "inversify";

// Types for the container
export const TYPES = {
  ConfigService: Symbol.for("ConfigService"),
  DatabaseService: Symbol.for("DatabaseService"),
  MetricsService: Symbol.for("MetricsService"),
  MqttService: Symbol.for("MqttService"),
  AnalyticsController: Symbol.for("AnalyticsController"),
  NotificationService: Symbol.for("NotificationService")
};

// Create and export the IoC container
const container = new Container();

// Export methods for getting and registering services
export { container };

// Helper function to get a service from the container
export function getService<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
  return container.get<T>(serviceIdentifier);
}
