import { Database } from 'bun:sqlite';
import { createDatabaseTables } from './schema';
import { inject, injectable } from 'inversify';
import { ConfigService } from '../services/config.service';
import { TYPES } from '../ioc/container';

@injectable()
export class DatabaseService {
  private db: Database;

  constructor(@inject(TYPES.ConfigService) private configService: ConfigService) {
    const dbPath = this.configService.get('DATABASE_PATH');
    
    this.db = new Database(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
    
    // Create tables if they don't exist
    createDatabaseTables(this.db);

    console.log(`Connected to SQLite database at ${dbPath}`);
  }

  query<T = any>(sql: string, params?: any[]): T[] {
    try {
      const stmt = this.db.prepare(sql);
      
      if (params) {
        return stmt.all(...params) as T[];
      }
      
      return stmt.all() as T[];
    } catch (error) {
      console.error(`Database query error: ${error}`);
      throw error;
    }
  }

  run(sql: string, params?: any[]): { lastInsertId: number, changes: number } {
    try {
      const stmt = this.db.prepare(sql);
      
      if (params) {
        const result = stmt.run(...params);
        return {
          lastInsertId: Number(result.lastInsertRowid),
          changes: result.changes
        };
      }
      
      const result = stmt.run();
      return {
        lastInsertId: Number(result.lastInsertRowid),
        changes: result.changes
      };
    } catch (error) {
      console.error(`Database run error: ${error}`);
      throw error;
    }
  }

  get<T = any>(sql: string, params?: any[]): T | null {
    try {
      const stmt = this.db.prepare(sql);
      
      if (params) {
        return stmt.get(...params) as T || null;
      }
      
      return stmt.get() as T || null;
    } catch (error) {
      console.error(`Database get error: ${error}`);
      throw error;
    }
  }
  
  transaction<T>(callback: () => T): T {
    this.db.exec('BEGIN');
    try {
      const result = callback();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
