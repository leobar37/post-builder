/**
 * Database Client
 *
 * This module handles the SQLite database connection only.
 * For data access (queries), use the repositories from './repositories/'.
 *
 * Architecture:
 *   client.ts          -> Database connection (this file)
 *   repositories/*.ts  -> SQL queries and CRUD operations
 *   services/*.ts      -> Business logic
 *
 * Example:
 *   // ❌ Don't use getDatabase() directly in services
 *   // ✅ Use repositories instead
 *   import { getProjectRepository } from './repositories/index.js'
 *   const project = getProjectRepository().getById('xxx')
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

/**
 * Get or create the SQLite database connection
 * Initializes schema on first call
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = join(dataDir, "reels.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  if (!db) return;
  const schemaPath = join(__dirname, "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Re-export repositories for convenience
export * from "./repositories/index.js";
