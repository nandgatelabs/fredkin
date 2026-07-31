import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

import { CREATE_TABLES_SQL, SCHEMA_VERSION } from "./schema";
import { seedDefaultsIfEmpty } from "./seed";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(CREATE_TABLES_SQL);

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

async function openAppDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS !== "web") {
    return SQLite.openDatabaseAsync("money-money.db");
  }

  // Web SQLite (OPFS) needs COOP/COEP and can fail in some browsers / private mode.
  try {
    const db = await SQLite.openDatabaseAsync("money-money.db");
    // Touch the DB so worker/VFS errors surface here, not later.
    await db.execAsync("PRAGMA user_version;");
    return db;
  } catch (err) {
    console.warn(
      "Persistent web SQLite failed; using in-memory DB for this session.",
      err,
    );
    return SQLite.openDatabaseAsync(":memory:");
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openAppDatabase();
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
