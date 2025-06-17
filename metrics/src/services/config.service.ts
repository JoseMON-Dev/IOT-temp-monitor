import { injectable } from "inversify";
import { config } from "dotenv";

// Default configurations
const defaults = {
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  DATABASE_PATH: process.env.DATABASE_PATH,
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
  MQTT_CLIENT_ID: process.env.MQTT_CLIENT_ID,
  TEMP_TOPIC: process.env.TEMP_TOPIC,
  HUMIDITY_TOPIC: process.env.HUMIDITY_TOPIC,
  ALERT_TOPIC: process.env.ALERT_TOPIC,
  ALERT_THRESHOLD: process.env.ALERT_THRESHOLD,
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
  ALERT_PHONE_NUMBER: process.env.ALERT_PHONE_NUMBER,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
  CERT_FILE_PATH: process.env.CERT_FILE_PATH,
};


@injectable()
export class ConfigService {
  private readonly configMap: Map<keyof typeof defaults, string>;

  constructor() {
    // Load environment variables from .env file
    config();

    this.configMap = new Map<keyof typeof defaults, string>();

    // Initialize with defaults and override with environment variables
    Object.keys(defaults).forEach((key) => {
      if (defaults[key as keyof typeof defaults] === undefined) {
        throw new Error(`Default value for ${key} is undefined. Please check your configuration.`);
      }
      const value: string = defaults[key as keyof typeof defaults]!;
      this.configMap.set(key as keyof typeof defaults, value);
    });
  }

  /**
   * Get a configuration value
   * @param key Configuration key
   * @returns The configuration value or undefined if not found
   */
  get(key: keyof typeof defaults): string {
    return this.configMap.get(key) || "";
  }

  /**
   * Get a configuration value as a number
   * @param key Configuration key
   * @returns The configuration value as a number or undefined if not found
   */
  getNumber(key: keyof typeof defaults): number {
    const value = this.get(key);
    return value ? Number(value) : 0;
  }

  /**
   * Get a configuration value as a boolean
   * @param key Configuration key
   * @returns The configuration value as a boolean or false if not found
   */
  getBoolean(key: keyof typeof defaults): boolean {
    const value = this.get(key);
    return value ? value.toLowerCase() === "true" : false;
  }
}
