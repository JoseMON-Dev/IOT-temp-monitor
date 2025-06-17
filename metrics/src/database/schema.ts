import { Database } from 'bun:sqlite';

export function createDatabaseTables(db: Database): void {
  // Temperature Readings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS temperature_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Temperature Alerts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS temperature_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      temperature REAL NOT NULL,
      duration INTEGER,
      max_temperature REAL,
      resolved BOOLEAN DEFAULT 0,
      resolved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // System Status table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      uptime REAL NOT NULL,
      wifi_signal_strength REAL,
      mqtt_connected BOOLEAN NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Cooling Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cooling_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      activated_at TEXT NOT NULL,
      deactivated_at TEXT,
      duration INTEGER,
      trigger_type TEXT NOT NULL CHECK(trigger_type IN ('auto', 'manual')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Hourly Temperature Aggregation table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hourly_temperature_agg (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      avg_temperature REAL NOT NULL,
      min_temperature REAL NOT NULL,
      max_temperature REAL NOT NULL,
      avg_humidity REAL,
      min_humidity REAL,
      max_humidity REAL,
      readings_count INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, hour)
    );
  `);

  // Daily Temperature Aggregation table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_temperature_agg (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      avg_temperature REAL NOT NULL,
      min_temperature REAL NOT NULL,
      max_temperature REAL NOT NULL,
      avg_humidity REAL,
      min_humidity REAL,
      max_humidity REAL,
      readings_count INTEGER NOT NULL,
      alerts_count INTEGER NOT NULL DEFAULT 0,
      cooling_events_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
    );
  `);
  
  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_temp_readings_timestamp ON temperature_readings(timestamp);
    CREATE INDEX IF NOT EXISTS idx_temp_alerts_timestamp ON temperature_alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_cooling_events_timestamp ON cooling_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_hourly_agg_date ON hourly_temperature_agg(date);
    CREATE INDEX IF NOT EXISTS idx_daily_agg_date ON daily_temperature_agg(date);
  `);
}
