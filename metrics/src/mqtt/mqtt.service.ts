import { connect, IClientOptions, MqttClient } from 'mqtt';
import { injectable, inject } from 'inversify';
import { ConfigService } from '../services/config.service';
import { MetricsService } from '../services/metrics.service';
import { TYPES } from '../ioc/container';

@injectable()
export class MqttService {
  private client: MqttClient | null = null;
  private isConnected = false;

  constructor(
    @inject(TYPES.ConfigService) private configService: ConfigService,
    @inject(TYPES.MetricsService) private metricsService: MetricsService
  ) {}

  /**
   * Connect to the MQTT broker
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const brokerUrl = this.configService.get('MQTT_BROKER_URL');
    const username = this.configService.get('MQTT_USERNAME');
    const password = this.configService.get('MQTT_PASSWORD');
    const clientId = this.configService.get('MQTT_CLIENT_ID');
    console.log(`Connecting to MQTT broker at ${brokerUrl} with client ID ${clientId} username ${username} and password ${password}`);
    const options: IClientOptions = {
      clientId: `${clientId}_${crypto.randomUUID()}}`,
      clean: true,
      reconnectPeriod: 5000,
      rejectUnauthorized: false,
      ca: await Bun.file(this.configService.get("CERT_FILE_PATH")).text()
    };

    if (username && password) {
      options.username = username;
      options.password = password;
    }

    try {
      this.client = connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to MQTT broker:', brokerUrl);
        this.subscribeToTopics();
      });

      this.client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        this.isConnected = false;
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString());
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        console.log('MQTT client is offline');
      });

      this.client.on('reconnect', () => {
        console.log('MQTT client is trying to reconnect');
      });
    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error);
    }
  }

  /**
   * Subscribe to the configured topics
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.isConnected) {
      return;
    }

    const tempTopic = this.configService.get('TEMP_TOPIC');
    const humidityTopic = this.configService.get('HUMIDITY_TOPIC');
    const alertTopic = this.configService.get('ALERT_TOPIC');

    this.client.subscribe([tempTopic, humidityTopic, alertTopic, "industrial/status/#"], (err) => {
      if (err) {
        console.error('Failed to subscribe to topics:', err);
      } else {
        console.log('Subscribed to topics:', [tempTopic, humidityTopic, alertTopic]);
      }
    });
  }

  /**
   * Handle incoming MQTT messages
   * @param topic The topic of the message
   * @param message The message payload
   */
  private handleMessage(topic: string, message: string): void {
    try {
      
      const tempTopic = this.configService.get('TEMP_TOPIC');
      const humidityTopic = this.configService.get('HUMIDITY_TOPIC');
      const alertTopic = this.configService.get('ALERT_TOPIC');
      if (topic === tempTopic) {
        // Handle temperature reading
        const temperature = parseFloat(message);
        if (!isNaN(temperature)) {
          this.metricsService.recordTemperature(temperature);
        }
      }
      else if (topic === humidityTopic) {
        // Handle humidity reading
        const humidity = parseFloat(message);
        if (!isNaN(humidity)) {
          this.metricsService.recordHumidity(humidity);
        }
      }
      if (topic === alertTopic) {
        // Handle alert
        if (message === 'HIGH_TEMP_ALERT') {
          console.warn('High temperature alert received:', message);
          this.metricsService.recordAlert(true);
        } else if (message === 'TEMP_NORMAL') {
          this.metricsService.recordAlert(false);
        }
      }
      if (topic === "industrial/status/servo" || topic === "industrial/status/mode") {
        // Handle status messages
        const statusType = topic.split('/').pop();
        console.log(`Received status update on topic ${topic}: ${message}`);
        if (statusType === 'servo') {
          const isActive = message === 'ACTIVE';
          console.log(`Servo status changed to: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);  
          this.metricsService.recordCoolingEvent(isActive, message.includes('MANUAL') ? 'manual' : 'auto');
        }
        else if (statusType === 'mode') {
          // Just log the mode, no need to store it
          console.log(`System mode changed to: ${message}`);
        }
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }


  /**
   * Disconnect from the MQTT broker
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      console.log('Disconnected from MQTT broker');
    }
  }

  /**
   * Check if the client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}
