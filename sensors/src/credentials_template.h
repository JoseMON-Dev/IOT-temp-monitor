#ifndef CREDENTIALS_H
#define CREDENTIALS_H

// WiFi credentials
const char *ssid = "WIFI_SSID";         // Replace with your WiFi SSID
const char *password = "WIFI_PASSWORD"; // Replace with your WiFi password

// MQTT broker settings
const char *mqtt_server = "MQTT_SERVER";     // Replace with your MQTT broker address
const int mqtt_port = 1883;                  // Replace with your MQTT broker port
const char *mqtt_username = "MQTT_USERNAME"; // Replace with your MQTT username
const char *mqtt_password = "MQTT_PASSWORD"; // Replace with your MQTT password
const char *temp_topic = "industrial/temperature";
const char *humidity_topic = "industrial/humidity";
const char *alert_topic = "industrial/alert";
const char *client_id = "ESP32_Temperature_Monitor";

#endif // CREDENTIALS_H
