# IoT Temperature Monitoring Metrics Service

This service handles the collection, storage, analysis, and visualization of temperature data from the IoT sensors. Built with Bun as the JavaScript runtime and TypeScript for type safety.

## Features

- **Data Collection**: Collects temperature, humidity, and system status data from IoT devices via MQTT
- **Data Storage**: Stores metrics in SQLite database with optimized schema
- **Data Aggregation**: Automatically aggregates data hourly and daily for efficient querying
- **Advanced Analytics**: Provides statistical analysis of temperature patterns and system performance
- **RESTful API**: Exposes endpoints for retrieving metrics and statistics
- **Real-time Processing**: Processes incoming data in real-time for immediate alerting

## Technology Stack

- **Runtime**: [Bun](https://bun.sh/) - A fast JavaScript runtime with built-in bundler and package manager
- **Language**: TypeScript - For type safety and better developer experience
- **Web Framework**: Elysia - A fast, modern web framework for Bun
- **Database**: SQLite (via Bun's built-in SQLite integration)
- **MQTT Client**: For subscribing to IoT device data
- **Date Handling**: date-fns for working with dates and times

## Project Structure

```
metrics/
├── data/                 # SQLite database storage
├── src/
│   ├── controllers/      # API controllers
│   ├── database/         # Database service and schema
│   ├── models/           # TypeScript interfaces and types
│   ├── mqtt/             # MQTT client service
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions and helpers
│   └── index.ts          # Application entry point
├── .env                  # Environment variables (not in repo)
├── .env.template         # Template for environment variables
├── .gitignore            # Git ignore file
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.MD             # Project documentation
```

## API Endpoints

### Temperature Endpoints

- **GET /api/analytics/temperature/latest**
  - Returns the latest temperature reading
  - Query params: `deviceId` (optional)

- **GET /api/analytics/temperature/range**
  - Returns temperature readings within a date range
  - Query params: `start`, `end`, `deviceId` (all optional)

### Alert Endpoints

- **GET /api/analytics/alerts**
  - Returns temperature alerts within a date range
  - Query params: `start`, `end`, `deviceId` (all optional)

### Cooling System Endpoints

- **GET /api/analytics/cooling**
  - Returns cooling system events within a date range
  - Query params: `start`, `end`, `deviceId` (all optional)

### Statistical Endpoints

- **GET /api/analytics/statistics**
  - Returns comprehensive statistics for a date range
  - Query params: `start`, `end`, `deviceId` (all optional)

- **GET /api/analytics/hourly**
  - Returns hourly aggregated temperature data
  - Query params: `start`, `end`, `deviceId` (all optional)

- **GET /api/analytics/daily**
  - Returns daily aggregated temperature data
  - Query params: `start`, `end`, `deviceId` (all optional)

## Statistical Analysis

This service provides the following statistical analysis:

- **Temperature Trends**: Analyze how temperature changes over time
- **Alert Frequency**: Track how often temperatures exceed threshold
- **Cooling System Efficiency**: Measure how quickly cooling reduces temperature
- **Pattern Recognition**: Identify recurring patterns in temperature fluctuations
- **Threshold Analysis**: Calculate time spent above temperature threshold

## Installation

1. Install Bun (if not already installed)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Clone the repository
   ```bash
   git clone [repository-url]
   cd IOT-temp-monitor/metrics
   ```

3. Install dependencies
   ```bash
   bun install
   ```

4. Configure environment variables
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

5. Run the service
   ```bash
   bun run start
   ```

## Development

- **Development mode** (with hot reload)
  ```bash
  bun run dev
  ```

- **Run tests**
  ```bash
  bun test
  ```

## Architecture Design Patterns

This project implements several design patterns:

- **Dependency Injection**: For loose coupling between components
- **Repository Pattern**: For data access abstraction
- **Service Layer**: For business logic encapsulation
- **MVC Pattern**: For API endpoints (Model-View-Controller)

## License

MIT
