# Industrial Temperature Monitoring System

This is an IoT solution for monitoring ambient temperature in an industrial setting, specifically designed for a smart warehouse storing food that requires strict temperature monitoring.

## Hardware Requirements

- ESP32 Controller (using Adafruit Feather ESP32 V2)
- DHT22 Temperature and Humidity Sensor
- Buzzer/Beeper
- Servo Motor (for cooling mechanism)
- LED (for visual alerts)
- 2 Buttons (for manual control and mode switching)
- Jumper wires
- Breadboard

## Wiring Diagram

| Component | ESP32 Pin |
|-----------|-----------|
| DHT22 Data | GPIO4 |
| Buzzer | GPIO5 |
| Servo | GPIO13 |
| LED | GPIO2 (built-in) |
| Button 1 | GPIO14 |
| Button 2 | GPIO15 |

## Software Features

- Temperature and humidity monitoring using DHT22 sensor
- Audible alarm (beep) when temperature exceeds 37°C
- Visual indicator (LED) when in alert state
- Servo motor activation to simulate cooling mechanism
- MQTT connectivity for remote monitoring and control
- Automatic and manual operation modes
- Two physical buttons for local control
- Periodic publishing of sensor data to MQTT broker

## Configuration

Before uploading the code to your ESP32, you need to modify the following parameters in the `main.cpp` file:

1. WiFi credentials:
   ```cpp
   const char* ssid = "YourWiFiSSID";
   const char* password = "YourWiFiPassword";
   ```

2. MQTT broker settings:
   ```cpp
   const char* mqtt_server = "YourMQTTBroker.com";
   const int mqtt_port = 1883;
   const char* mqtt_username = "YourMQTTUsername";
   const char* mqtt_password = "YourMQTTPassword";
   ```

## MQTT Topics

The system uses the following MQTT topics:

### Publishing (from ESP32 to broker)
- `industrial/temperature`: Current temperature readings (°C)
- `industrial/humidity`: Current humidity readings (%)
- `industrial/alert`: Alert status ("HIGH_TEMP_ALERT" or "TEMP_NORMAL")
- `industrial/status/servo`: Servo status ("ACTIVE" or "INACTIVE")
- `industrial/status/mode`: Current operation mode ("AUTO" or "MANUAL")

### Subscribing (from broker to ESP32)
- `industrial/control/servo`: Remote servo control ("ON" or "OFF")
- `industrial/control/mode`: Remote mode control ("MANUAL" or "AUTO")

## Operation Modes

### Automatic Mode
- System automatically activates the cooling mechanism (servo) when temperature exceeds 37°C
- Alarm (beeper and LED) activates when temperature exceeds threshold
- Cooling and alarm automatically deactivate when temperature falls below threshold (with hysteresis)

### Manual Mode
- Cooling mechanism can be controlled manually using Button 1 or via MQTT
- Alarm still activates automatically based on temperature
- Useful for maintenance or override scenarios

## Physical Controls

- **Button 1**: Toggle servo on/off
- **Button 2**: Toggle between automatic and manual modes

## Building and Uploading

This project uses PlatformIO for easy dependency management and deployment:

1. Install PlatformIO IDE extension in Visual Studio Code
2. Open this project folder
3. Configure your WiFi and MQTT settings in the code
4. Connect your ESP32 to your computer
5. Click the "Build" button in the PlatformIO toolbar
6. Click the "Upload" button to flash the ESP32

## Visualization and Control

To visualize the data and control the system remotely, you can use:

1. **NodeRED**: For creating dashboards and logic flows
2. **ThingSpeak**: For data logging and visualization
3. **Custom Web/Desktop Application**: For more advanced control and monitoring

## Troubleshooting

- Ensure all libraries are properly installed
- Check the wiring connections
- Verify WiFi and MQTT credentials
- Monitor the serial output for debugging information (115200 baud rate)
