# IOT Temperature Monitoring System

  

## Descripción del Proyecto

  

El Sistema de Monitoreo de Temperatura IOT es una solución integral para la supervisión en tiempo real de temperatura y humedad en entornos industriales, particularmente diseñado para el monitoreo de almacenes inteligentes que requieren un control estricto de temperatura para preservar alimentos y otros productos sensibles.

  

### Visión General

  

Este proyecto implementa un sistema completo de monitoreo ambiental que incluye sensores físicos (ESP32 con DHT22), un servicio de métricas backend, y un dashboard web interactivo. El sistema proporciona alertas en tiempo real cuando se detectan temperaturas fuera de los rangos seguros, activa mecanismos de refrigeración automatizados, y almacena datos históricos para análisis y cumplimiento normativo.

  

### Objetivos

  

-  **Monitoreo en tiempo real**: Capturar y visualizar datos de temperatura y humedad continuamente

-  **Alerta temprana**: Notificar inmediatamente cuando las condiciones exceden umbrales predefinidos

-  **Control automatizado**: Activar sistemas de refrigeración cuando sea necesario

-  **Análisis de datos**: Proporcionar herramientas para analizar tendencias y patrones a lo largo del tiempo

-  **Redundancia y fiabilidad**: Asegurar la operación continua incluso en caso de fallos parciales

  

### Funcionamiento

  

El sistema opera siguiendo este flujo:

1. Los sensores ESP32 miden temperatura y humedad en intervalos regulares

2. Los datos se transmiten a través de MQTT a un servidor central de métricas

3. El servidor almacena los datos en una base de datos SQLite

4. Si la temperatura excede el umbral (37°C), se activan alarmas y el sistema de refrigeración

5. El dashboard web muestra los datos en tiempo real y permite el control del sistema

6. Se envían notificaciones (SMS) a los administradores en caso de alertas críticas

  

## Arquitectura del Sistema

  

### Capas de la Arquitectura

1.  **Capa de Sensores**: Dispositivos ESP32 con sensores DHT22, actuadores y conexión WiFi

2.  **Capa de Comunicación**: Protocolo MQTT sobre conexión WiFi segura

3.  **Capa de Procesamiento**: Servicio backend bun js con elysia para procesar y almacenar datos

4.  **Capa de Almacenamiento**: Base de datos SQLite para el registro histórico de métricas

5.  **Capa de Presentación**: Dashboard web node red o web apps con visualizaciones en tiempo real

6.  **Capa de Notificación**: Sistema de alertas SMS twilio para notificaciones críticas

  

### Flujo de Datos

1. Los sensores capturan datos de temperatura/humedad cada 500ms

2. Los datos se publican a través de MQTT al broker central

3. El servicio de métricas subscribe a los tópicos relevantes de MQTT

4. Los datos entrantes se procesan, validan y almacenan en la base de datos

5. Se ejecutan análisis y agregaciones periódicas sobre los datos

6. El frontend solicita datos a la API REST para actualizar el dashboard

7. En caso de alertas, se activan notificaciones y actuadores físicos

  

### Componentes

-  **Sensors**: Módulos ESP32 con firmware PlatformIO

-  **Metrics Service**: Servidor backend Node.js/TypeScript con Elysia y SQLite

-  **Dashboard**: Aplicación web

-  **MQTT Broker**: Servicio de mensajería central para comunicar todos los componentes

  

## Hardware Utilizado

  

### Sensores

-  **DHT22**: Sensor digital de temperatura y humedad con precisión de ±0.5°C y ±2-5% RH

-  **ESP32**: Microcontrolador con WiFi y Bluetooth integrados, 240 MHz dual-core, 520 KB SRAM

  

### Actuadores

-  **Servo Motor**: Simula un sistema de refrigeración/ventilación

-  **Buzzer/Alarma**: Proporciona alertas audibles cuando se exceden los umbrales

-  **LED**: Indicador visual de estado del sistema

  

### Componentes adicionales

-  **Botones**: Dos botones físicos para control manual y cambio de modo

-  **Circuito de alimentación**: Suministro estable de 5V para operación constante

-  **Breadboard y cableado**: Para prototipado y conexión de componentes

  

## Requisitos Funcionales

  

1.  **Monitoreo de Temperatura**

- RF1: El sistema debe medir la temperatura con precisión de al menos ±0.5°C

- RF2: Las lecturas deben realizarse al menos cada 500ms

- RF3: Todos los datos deben almacenarse con marcas de tiempo precisas

  

2.  **Sistema de Alertas**

- RF4: Activar alarma audible cuando la temperatura exceda 37°C

- RF5: Enviar notificaciones SMS a los administradores en caso de alertas

- RF6: Registrar la duración y temperatura máxima durante cada evento de alerta

  

3.  **Sistema de Refrigeración**

- RF7: Activar automáticamente el sistema de refrigeración cuando se supere el umbral

- RF8: Permitir control manual y automático del sistema de refrigeración

- RF9: Registrar todos los eventos de activación y desactivación

  

4.  **Dashboard**

- RF10: Mostrar temperatura y humedad actuales en tiempo real

- RF11: Proporcionar gráficos históricos con diferentes intervalos temporales

- RF12: Visualizar estadísticas de alertas y eventos de refrigeración

  

5.  **API de Análisis**

- RF13: Proporcionar endpoints para acceder a datos históricos y agregados

- RF14: Calcular estadísticas relevantes (máximos, mínimos, promedios)

- RF15: Permitir filtrado por rangos de fechas

  

## Requisitos No Funcionales

  

1.  **Rendimiento**

- RNF1: El sistema debe responder a condiciones de alerta en menos de 1 segundo

- RNF2: El dashboard debe actualizarse en tiempo real (máximo 1 segundo de retraso)

- RNF3: La API debe manejar al menos 100 solicitudes simultáneas

  

2.  **Disponibilidad**

- RNF4: El sistema debe tener un uptime superior al 99.9%

- RNF5: Los sensores deben seguir funcionando incluso sin conectividad WiFi (modo offline)

- RNF6: Los datos deben ser preservados en caso de fallos del sistema

  

3.  **Escalabilidad**

- RNF7: El sistema debe soportar la adición de nuevos sensores sin modificaciones mayores

- RNF8: La base de datos debe manejar eficientemente años de datos históricos

- RNF9: La arquitectura debe permitir la integración de nuevos tipos de sensores

  

4.  **Seguridad**

- RNF10: Todas las comunicaciones entre componentes deben estar cifradas

- RNF11: La API debe implementar autenticación y autorización

- RNF12: Los datos sensibles (credenciales) deben almacenarse de forma segura

  

5.  **Usabilidad**

- RNF13: El dashboard debe ser responsive y accesible desde dispositivos móviles

- RNF14: La interfaz debe ofrecer información clara y comprensible para usuarios no técnicos

- RNF15: Las alertas deben ser claras y distinguibles

  

## Estrategia de Ciberseguridad

  

### Seguridad en la Capa de Sensores

- Almacenamiento seguro de credenciales en un archivo separado (credentials.h)

- Conexiones WiFi y MQTT protegidas con autenticación

- Uso de firmware actualizado y buenas prácticas de programación

  

### Seguridad en la Comunicación

- Implementación de MQTT sobre SSL/TLS (WiFiClientSecure)

- Autenticación mediante usuario y contraseña para las conexiones MQTT

- Verificación de certificados para prevenir ataques man-in-the-middle
  

### Medidas Adicionales

- Monitoreo constante de intentos de acceso no autorizados

- Registros (logs) detallados de todas las operaciones críticas

- Actualizaciones regulares de todas las dependencias para mitigar vulnerabilidades conocidas

- Backups periódicos de los datos y configuraciones

- Plan de respuesta a incidentes definido para manejar violaciones de seguridad

  

## Tecnologías Utilizadas

  

### Hardware y Firmware

- ESP32 con PlatformIO

- Sensores DHT22, LED, Buzzer, Servo

- Arduino Framework

  

### Backend

- bun.js y TypeScript

- Elysia (Framework web)

- SQLite (Base de datos)

- MQTT para comunicación en tiempo real

- Inversify para inyección de dependencias

  

### Frontend

- Node red.


# Diagrama de Arquitectura del Sistema de Monitoreo de Temperatura IoT

  

## Diagrama de Componentes

  

```mermaid

graph TD

%% Definición de estilos

classDef sensor fill:#e1f5fe,stroke:#0288d1,stroke-width:2px

classDef communication fill:#fff8e1,stroke:#ffa000,stroke-width:2px

classDef backend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px

classDef frontend fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px

classDef database fill:#fbe9e7,stroke:#d84315,stroke-width:2px

classDef notification fill:#efebe9,stroke:#5d4037,stroke-width:2px

  

%% Componentes del sistema

ESP32["ESP32 / DHT22<br/>Sensor Module"] -->|"MQTT<br/>(Temperature/Humidity Data)"| MQTT["MQTT Broker<br/>(HiveMQ)"]

ESP32 -->|"Activación"| ACTUATORS["Actuadores<br/>(Servo/Buzzer)"]

MQTT -->|"Suscripción a<br/>Tópicos"| METRICS["Metrics Service<br/>(Bun.js + Elysia)"]

METRICS -->|"Almacena<br/>Datos"| DB["SQLite<br/>Database"]

METRICS -->|"REST API<br/>WebSockets"| DASHBOARD["Web Dashboard<br/>"]

METRICS -->|"Notificaciones<br/>Críticas"| NOTIFY["Notification<br/>Service (Twilio)"]

DB -->|"Consultas"| ANALYTICS["Analytics<br/>Controller"]

ANALYTICS -->|"Datos<br/>Procesados"| DASHBOARD

DASHBOARD -->|"API Calls"| METRICS

  

%% Aplicación de estilos

class ESP32,ACTUATORS sensor

class MQTT communication

class METRICS,ANALYTICS backend

class DASHBOARD frontend

class DB database

class NOTIFY notification

```

  

## Flujo de Datos

  

```mermaid

sequenceDiagram

participant Sensor as ESP32/DHT22 Sensor

participant MQTT as MQTT Broker

participant Metrics as Metrics Service

participant DB as SQLite Database

participant Dashboard as Web Dashboard

participant Notify as Notification Service

participant Actuator as Actuadores (Servo/Buzzer)

  

Sensor->>Sensor: Lee temperatura/humedad cada 500ms

Sensor->>MQTT: Publica datos (temp/humidity topics)

MQTT->>Metrics: Recibe datos (suscripción)

Metrics->>DB: Almacena lecturas

Metrics->>Metrics: Analiza datos (umbral > 37°C)

alt Temperatura > Umbral

Metrics->>Notify: Envía alerta crítica

Metrics->>MQTT: Publica comando de alarma

MQTT->>Sensor: Recibe comando de alarma

Sensor->>Actuator: Activa refrigeración y alarma

end

Dashboard->>Metrics: Solicita datos (REST API)

Metrics->>DB: Consulta datos históricos

DB->>Metrics: Retorna resultados

Metrics->>Dashboard: Envía datos para visualización

Metrics->>Dashboard: Stream en tiempo real (WebSockets)

```

  

## Arquitectura del Sistema

  

```mermaid

flowchart TD

subgraph "Capa de Sensores"

ESP["ESP32"] --- DHT["DHT22 Sensor"]

ESP --- BUZZER["Buzzer"]

ESP --- SERVO["Servo Motor"]

ESP --- LED["LED Indicador"]

ESP --- BUTTON["Botones de Control"]

end

subgraph "Capa de Comunicación"

WIFI["WiFi"] --- MQTTS["MQTT Seguro<br/>(TLS)"]

end

subgraph "Capa de Procesamiento"

BUN["Bun.js Runtime"] --- ELYSIA["Elysia Framework"]

ELYSIA --- ROUTES["API Routes"]

ELYSIA --- WS["WebSockets"]

IOC["Inversify IoC Container"] --- SERVICES["Servicios"]

end

subgraph "Capa de Almacenamiento"

SQLITE["SQLite"] --- MODELS["Modelos de Datos"]

SQLITE --- QUERIES["Consultas SQL"]

end

subgraph "Capa de Presentación"
Dashboard

end

subgraph "Capa de Notificación"

TWILIO["Twilio API"] --- SMS["Alertas SMS"]

end

%% Conexiones entre capas

ESP --> WIFI

WIFI --> BUN

BUN --> SQLITE

BUN --> TWILIO

Dashboard --> ROUTES

Dashboard --> WS

```

  

## Diagrama de Despliegue

  

```mermaid

graph TB

subgraph "Dispositivos IoT"

ESP32["ESP32 con DHT22<br/>Sensor Module"]

end

subgraph "Servidor de Métricas"

METRICS["Metrics Service<br/>Bun.js + Elysia"]

DB["SQLite Database"]

METRICS --- DB

end

subgraph "Frontend"

DASHBOARD["Web Dashboard<br/>"]

end

subgraph "Servicios en la Nube"

MQTT["MQTT Broker<br/>(HiveMQ)"]

TWILIO["Twilio SMS<br/>Service"]

end

ESP32 -->|"MQTT/TLS"| MQTT

MQTT -->|"MQTT/TLS"| METRICS

METRICS -->|"REST API"| DASHBOARD

METRICS -->|"WebSockets"| DASHBOARD

METRICS -->|"API"| TWILIO

TWILIO -->|"SMS"| ADMIN["Administradores<br/>(Teléfonos Móviles)"]

```
