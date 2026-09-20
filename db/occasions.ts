import { getDb } from "@/db/client";
import type { Occasion } from "@/db/types";
import { createId } from "@/lib/id";

function mapOccasion(row: Occasion): Occasion {
  return {
    id: row.id,
    title: row.title,
    occurred_at: row.occurred_at,
    note: row.note ?? "",
  };
}

function toIsoBound(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export async function getOccasion(id: string): Promise<Occasion | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Occasion>("SELECT * FROM occasions WHERE id = ?", id);
  return row ? mapOccasion(row) : null;
}

export async function createOccasion(input: {
  title: string;
  occurred_at: string;
  note?: string;
}): Promise<Occasion> {
  const title = input.title.trim();
  if (!title) throw new Error("Occasion title is required");
  const db = await getDb();
  const id = createId("occ");
  const note = input.note?.trim() ?? "";
  await db.runAsync(
    `INSERT INTO occasions (id, title, occurred_at, note) VALUES (?, ?, ?, ?)`,
    id,
    title,
    input.occurred_at,
    note,
  );
  return { id, title, occurred_at: input.occurred_at, note };
}

export async function updateOccasion(
  id: string,
  input: { title?: string; occurred_at?: string; note?: string },
): Promise<void> {
  const db = await getDb();
  const current = await db.getFirstAsync<Occasion>("SELECT * FROM occasions WHERE id = ?", id);
  if (!current) throw new Error("Occasion not found");
  const title = input.title !== undefined ? input.title.trim() : current.title;
  if (!title) throw new Error("Occasion title is required");
  await db.runAsync(
    `UPDATE occasions SET title = ?, occurred_at = ?, note = ? WHERE id = ?`,
    title,
    input.occurred_at ?? current.occurred_at,
    input.note !== undefined ? input.note.trim() : current.note,
    id,
  );
}

/** Unlink member events, then delete the folder. */
export async function deleteOccasion(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE records SET occasion_id = NULL WHERE occasion_id = ?", id);
    const result = await db.runAsync("DELETE FROM occasions WHERE id = ?", id);
    if (result.changes === 0) throw new Error("Occasion not found");
  });
}

export async function attachRecordsToOccasion(
  occasionId: string,
  recordIds: string[],
): Promise<void> {
  if (recordIds.length === 0) return;
  const db = await getDb();
  const occ = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM occasions WHERE id = ?",
    occasionId,
  );
  if (!occ) throw new Error("Occasion not found");
  await db.withTransactionAsync(async () => {
    for (const recordId of recordIds) {
      await db.runAsync("UPDATE records SET occasion_id = ? WHERE id = ?", occasionId, recordId);
    }
  });
}

export async function detachRecordFromOccasion(recordId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE records SET occasion_id = NULL WHERE id = ?", recordId);
}

/** Occasions whose date or any member falls in the range. */
export async function listOccasionsInRange(start: Date, end: Date): Promise<Occasion[]> {
  const db = await getDb();
  const a = toIsoBound(start);
  const b = toIsoBound(end);
  const rows = await db.getAllAsync<Occasion>(
    `SELECT DISTINCT o.*
     FROM occasions o
     LEFT JOIN records r ON r.occasion_id = o.id
     WHERE (o.occurred_at >= ? AND o.occurred_at <= ?)
        OR (r.occurred_at >= ? AND r.occurred_at <= ?)
     ORDER BY o.occurred_at DESC, o.title COLLATE NOCASE ASC`,
    a,
    b,
    a,
    b,
  );
  return rows.map(mapOccasion);
}

export async function listOccasionsOnDay(day: Date): Promise<Occasion[]> {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  return listOccasionsInRange(start, end);
}

export async function listOccasions(): Promise<Occasion[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Occasion>(
    `SELECT * FROM occasions ORDER BY occurred_at DESC, title COLLATE NOCASE ASC`,
  );
  return rows.map(mapOccasion);
}
