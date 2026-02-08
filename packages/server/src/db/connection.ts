import { Database } from "bun:sqlite";
import { SCHEMA_SQL } from "./schema.js";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = new Database("devgentic.db", { create: true });
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(SCHEMA_SQL);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
