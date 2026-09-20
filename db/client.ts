import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

import { log } from "@/lib/logger";
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from "./schema";
import { seedDefaultsIfEmpty } from "./seed";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function tableHasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

/** Idempotent column add — safe even if a previous migration marked the version early. */
async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (await tableHasColumn(db, table, column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(CREATE_TABLES_SQL);

  // Always repair missing columns (fixes DBs stuck after a failed v2 bump).
  await ensureColumn(db, "categories", "archived", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, "accounts", "archived", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, "records", "person_id", "TEXT");
  await ensureColumn(db, "records", "person_role", "TEXT");
  await ensureColumn(db, "records", "is_adjustment", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn(db, "accounts", "last_checked_balance", "REAL");
  await ensureColumn(db, "accounts", "last_checked_at", "TEXT");
  await ensureColumn(db, "records", "occasion_id", "TEXT");
  // After columns exist (CREATE TABLE IF NOT EXISTS will not add them on old DBs).
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_records_person ON records(person_id)",
  );
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_records_occasion ON records(occasion_id)",
  );
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_occasions_occurred_at ON occasions(occurred_at)",
  );

  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1",
  );
  const current = row?.version ?? 0;

  if (current < SCHEMA_VERSION) {
    await db.runAsync(
      "INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)",
      SCHEMA_VERSION,
      new Date().toISOString(),
    );
  }

  await seedDefaultsIfEmpty(db);
}

function isDeadNativeDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("NativeDatabase") ||
    msg.includes("NullPointerException") ||
    msg.includes("prepareAsync") ||
    msg.includes("execAsync")
  );
}

async function openAppDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS !== "web") {
    // Android can keep a dead shared handle after JS reload; force a fresh native connection.
    return SQLite.openDatabaseAsync("money-money.db", {
      useNewConnection: true,
    });
  }

  // Web SQLite (OPFS) needs COOP/COEP and exclusive access — a second tab
  // often throws NoModificationAllowedError. Fall back to :memory: for the session.
  try {
    const db = await SQLite.openDatabaseAsync("money-money.db");
    await db.execAsync("PRAGMA user_version;");
    return db;
  } catch (err) {
    console.warn(
      "Persistent web SQLite failed; using in-memory DB for this session.",
      err,
    );
    const memory = await SQLite.openDatabaseAsync(":memory:");
    await memory.execAsync("PRAGMA user_version;");
    return memory;
  }
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  log.info("Opening database", { platform: Platform.OS });
  const db = await openAppDatabase();
  await migrate(db);
  // Touch the connection so a dead native handle fails here, not on first user action.
  await db.getFirstAsync<{ v: number }>("SELECT 1 AS v");
  log.info("Database ready");
  return db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate().catch((err) => {
      // Allow a later retry after the user closes a conflicting tab / reloads.
      log.error("Database open failed", err);
      dbPromise = null;
      throw err;
    });
  }

  try {
    return await dbPromise;
  } catch (err) {
    throw err;
  }
}

/**
 * Run a DB op; on Android native-handle death, drop the cache and retry once.
 */
export async function withDb<T>(fn: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  try {
    const db = await getDb();
    return await fn(db);
  } catch (err) {
    if (!isDeadNativeDbError(err)) throw err;
    log.warn("DB handle dead; reopening", err);
    resetDbConnection();
    const db = await getDb();
    return fn(db);
  }
}

/** Test helper / recovery: drop cached connection so next getDb() remigrates. */
export function resetDbConnection() {
  dbPromise = null;
}

export async function getSetting(key: string): Promise<string | null> {
  return withDb(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      key,
    );
    return row?.value ?? null;
  });
}

export async function setSetting(key: string, value: string): Promise<void> {
  await withDb(async (db) => {
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      key,
      value,
    );
  });
}
