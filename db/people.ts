import { archiveAccount } from "@/db/accounts";
import { getDb } from "@/db/client";
import type { Person } from "@/db/types";
import { createId } from "@/lib/id";

export type PersonListItem = Person & {
  theyOwe: number;
  youOwe: number;
  spentOn: number;
};

function mapPerson(row: Person): Person {
  return {
    ...row,
    note: row.note ?? "",
    archived: row.archived ?? 0,
    converted_from_account_id: row.converted_from_account_id ?? null,
  };
}

export async function listPeople(): Promise<PersonListItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<
    Person & { they_owe: number; you_owe: number; spent_on: number }
  >(
    `SELECT
       p.*,
       COALESCE(SUM(CASE WHEN r.person_role = 'they_owe' THEN r.amount ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN r.person_role = 'settled' AND r.type = 'income' THEN r.amount ELSE 0 END), 0)
         AS they_owe,
       COALESCE(SUM(CASE WHEN r.person_role = 'you_owe' THEN r.amount ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN r.person_role = 'settled' AND r.type != 'income' THEN r.amount ELSE 0 END), 0)
         AS you_owe,
       COALESCE(SUM(CASE
         WHEN r.type = 'expense' AND IFNULL(r.person_role, 'with') IN ('with', 'gift') THEN r.amount
         ELSE 0 END), 0) AS spent_on
     FROM people p
     LEFT JOIN records r ON r.person_id = p.id
     WHERE p.archived = 0
     GROUP BY p.id
     ORDER BY p.name COLLATE NOCASE ASC`,
  );
  return rows.map((r) => ({
    ...mapPerson(r),
    theyOwe: r.they_owe,
    youOwe: r.you_owe,
    spentOn: r.spent_on,
  }));
}

export async function getPerson(id: string): Promise<Person | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Person>("SELECT * FROM people WHERE id = ?", id);
  return row ? mapPerson(row) : null;
}

export async function createPerson(input: {
  name: string;
  note?: string;
  converted_from_account_id?: string | null;
}): Promise<Person> {
  const db = await getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Person name is required");

  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM people WHERE name = ? COLLATE NOCASE LIMIT 1",
    name,
  );
  if (existing) throw new Error("A person with that name already exists");

  const id = createId("per");
  const note = input.note?.trim() ?? "";
  const converted = input.converted_from_account_id ?? null;
  await db.runAsync(
    `INSERT INTO people (id, name, note, archived, converted_from_account_id)
     VALUES (?, ?, ?, 0, ?)`,
    id,
    name,
    note,
    converted,
  );
  return {
    id,
    name,
    note,
    archived: 0,
    converted_from_account_id: converted,
  };
}

export async function updatePerson(
  id: string,
  input: { name?: string; note?: string },
): Promise<void> {
  const db = await getDb();
  const current = await getPerson(id);
  if (!current) throw new Error("Person not found");
  const name = input.name?.trim() || current.name;
  if (name.toLowerCase() !== current.name.toLowerCase()) {
    const clash = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM people WHERE name = ? COLLATE NOCASE AND id != ? LIMIT 1",
      name,
      id,
    );
    if (clash) throw new Error("A person with that name already exists");
  }
  await db.runAsync(
    "UPDATE people SET name = ?, note = ? WHERE id = ?",
    name,
    input.note !== undefined ? input.note.trim() : current.note,
    id,
  );
}

export async function deletePerson(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE records SET person_id = NULL, person_role = NULL WHERE person_id = ?", id);
    const result = await db.runAsync("DELETE FROM people WHERE id = ?", id);
    if ((result.changes ?? 0) === 0) throw new Error("Person not found");
  });
}

/** Create a person from a wallet name and ignore the wallet. Ledger rows on the wallet stay. */
export async function convertAccountToPerson(accountId: string): Promise<Person> {
  const db = await getDb();
  const account = await db.getFirstAsync<{ id: string; name: string }>(
    "SELECT id, name FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account) throw new Error("Wallet not found");
  const person = await createPerson({
    name: account.name,
    converted_from_account_id: account.id,
  });
  await archiveAccount(account.id);
  return person;
}
