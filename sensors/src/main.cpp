#include <Arduino.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "credentials.h" // Include credentials from separate file

// Pin Definitions
#define DHT_PIN 14     // DHT22 sensor pin
#define BUZZER_PIN 26  // Buzzer pin
#define SERVO_PIN 4    // Servo motor pin
#define LED_PIN 27     // LED pin (built-in LED on most ESP32 boards)
#define BUTTON1_PIN 2  // First button pin
#define BUTTON2_PIN 15 // Second button pin

// Constants
#define DHT_TYPE DHT22      // DHT sensor type
#define TEMP_THRESHOLD 37.0 // Temperature threshold in Celsius
#define PUBLISH_INTERVAL 500

// Credentials are now loaded from credentials.h

// Objects
DHT dht(DHT_PIN, DHT_TYPE);
Servo coolingServo;
WiFiClientSecure espClient;
PubSubClient mqtt(espClient);

// Variables
float temperature = 0;
float humidity = 0;
bool alarmActive = false;
unsigned long lastPublishTime = 0;
bool servoActive = false;
bool manualControlMode = false;

// Function Declarations
void connectWiFi();
void connectMQTT();
void readSensorData();
void checkTemperature();
void activateAlarm();
void deactivateAlarm();
void activateServo();
void deactivateServo();
void publishData();
void handleButtons();
void callback(char *topic, byte *payload, unsigned int length);

void setup()
{
  // Initialize serial communication
  Serial.begin(115200);
  Serial.println("Industrial Temperature Monitoring System");

  // Initialize pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON1_PIN, INPUT_PULLUP);
  pinMode(BUTTON2_PIN, INPUT_PULLUP);

  // Initialize servo
  coolingServo.attach(SERVO_PIN);
  coolingServo.write(0); // Initial position

  // Initialize DHT sensor
  dht.begin();

  // Connect to WiFi
  connectWiFi();

  // Setup MQTT
  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(callback);
  connectMQTT();

  Serial.println("System initialized and ready");
}

void loop()
{
  // Maintain MQTT connection
  if (!mqtt.connected())
  {
    connectMQTT();
  }
  mqtt.loop();

  // Read sensor data
  readSensorData();

  // Publish data periodically
  publishData();

  // Check temperature and take action if needed
  checkTemperature();

  // Handle button inputs
  handleButtons();

  delay(100);
}

void connectWiFi()
{
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void connectMQTT()
{
  while (!mqtt.connected())
  {
    Serial.print("Connecting to MQTT broker...");
    espClient.setInsecure();
    if (mqtt.connect(client_id, mqtt_username, mqtt_password))
    {
      Serial.println("connected");

      // Subscribe to topics
      mqtt.subscribe(servo_control_topic);
      mqtt.subscribe(servo_control_topic_mode);
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char *topic, byte *payload, unsigned int length)
{
  // Convert payload to string
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  Serial.println(message);

  // Handle remote commands
  if (strcmp(topic, servo_control_topic_mode) == 0)
  {
    if (strcmp(message, "ON") == 0 && manualControlMode)
    {
      activateServo();
    }
    else if (strcmp(message, "OFF") == 0 && manualControlMode)
    {
      deactivateServo();
    }
  }
  else if (strcmp(topic, servo_control_topic_mode) == 0)
  {
    if (strcmp(message, "MANUAL") == 0)
    {
      manualControlMode = true;
      Serial.println("Switched to manual control mode");
    }
    else if (strcmp(message, "AUTO") == 0)
    {
      manualControlMode = false;
      Serial.println("Switched to automatic control mode");
    }
  }
}

void readSensorData()
{
  // Read humidity and temperature
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  // Check if any reads failed
  if (isnan(humidity) || isnan(temperature))
  {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" °C, Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
}

void checkTemperature()
{
  if (temperature > TEMP_THRESHOLD && !alarmActive)
  {
    activateAlarm();

    // Activate servo cooling system in auto mode
    if (!manualControlMode && !servoActive)
    {
      activateServo();
    }

    // Publish alert
    mqtt.publish(alert_topic, "HIGH_TEMP_ALERT", true);
  }
  else if (temperature <= TEMP_THRESHOLD - 2 && alarmActive)
  {
    // Add a 2-degree hysteresis to prevent frequent on/off switching
    deactivateAlarm();

    // Deactivate servo in auto mode when temperature is acceptable
    if (!manualControlMode && servoActive)
    {
      deactivateServo();
    }

    mqtt.publish(alert_topic, "TEMP_NORMAL", true);
  }
}

void activateAlarm()
{
  alarmActive = true;
  digitalWrite(LED_PIN, HIGH);
  tone(BUZZER_PIN, 1000, 500); // 1 kHz beep
  Serial.println("ALERT! Temperature above threshold!");
}

void deactivateAlarm()
{
  alarmActive = false;
  digitalWrite(LED_PIN, LOW);
  noTone(BUZZER_PIN);
  Serial.println("Temperature back to normal range");
}

void activateServo()
{
  servoActive = true;
  coolingServo.write(180); // Move to max position (simulate fan/cooling)
  Serial.println("Cooling system activated");
  mqtt.publish(servo_control_topic, "ACTIVE", true);
}

void deactivateServo()
{
  servoActive = false;
  coolingServo.write(0); // Move back to initial position
  Serial.println("Cooling system deactivated");
  mqtt.publish(servo_control_topic, "INACTIVE", true);
}

void publishData()
{
  // Convert float values to strings
  char tempStr[8];
  char humStr[8];
  dtostrf(temperature, 5, 2, tempStr);
  dtostrf(humidity, 5, 2, humStr);

  // Publish temperature and humidity
  mqtt.publish(temp_topic, tempStr, true);
  mqtt.publish(humidity_topic, humStr, true);

  Serial.println("Data published to MQTT broker");
}

void handleButtons()
{
  // Button 1: Toggle servo manually
  if (digitalRead(BUTTON1_PIN) == LOW)
  {
    delay(50); // Debounce
    if (digitalRead(BUTTON1_PIN) == LOW)
    {
      Serial.println("Button 1 pressed: Toggle servo");

      if (servoActive)
      {
        deactivateServo();
      }
      else
      {
        activateServo();
      }

      // Wait for button release to prevent multiple toggles
      while (digitalRead(BUTTON1_PIN) == LOW)
      {
        delay(10);
      }
    }
  }

  // Button 2: Toggle between auto and manual mode
  if (digitalRead(BUTTON2_PIN) == LOW)
  {
    delay(50); // Debounce
    if (digitalRead(BUTTON2_PIN) == LOW)
    {
      manualControlMode = !manualControlMode;

      Serial.print("Button 2 pressed: Switched to ");
      Serial.println(manualControlMode ? "manual mode" : "automatic mode");

      // Publish mode change
      mqtt.publish(servo_control_topic_mode,
                   manualControlMode ? "MANUAL" : "AUTO",
                   true);

      // Wait for button release to prevent multiple toggles
      while (digitalRead(BUTTON2_PIN) == LOW)
      {
        delay(10);
      }
    }
  }
}
