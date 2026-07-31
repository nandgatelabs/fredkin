import { createId } from "@/lib/id";

import { getDb } from "./client";
import type { Category, CategoryType } from "./types";

export async function listCategories(type?: CategoryType): Promise<Category[]> {
  const db = await getDb();
  if (type) {
    return db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE archived = 0 AND type = ? ORDER BY sort_order ASC, name ASC`,
      type,
    );
  }
  return db.getAllAsync<Category>(
    `SELECT * FROM categories WHERE archived = 0 ORDER BY type ASC, sort_order ASC, name ASC`,
  );
}

export async function createCategory(input: {
  name: string;
  type: CategoryType;
  icon_key?: string;
  color?: string;
}): Promise<Category> {
  const db = await getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");

  const max = await db.getFirstAsync<{ m: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories WHERE type = ?",
    input.type,
  );
  const id = createId("cat");
  const icon_key = input.icon_key ?? (input.type === "income" ? "wallet" : "pricetag");
  const color = input.color ?? (input.type === "income" ? "#81C784" : "#E88F78");
  const sort_order = (max?.m ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO categories (id, name, type, icon_key, color, sort_order, archived)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    id,
    name,
    input.type,
    icon_key,
    color,
    sort_order,
  );

  return {
    id,
    name,
    type: input.type,
    icon_key,
    color,
    sort_order,
    archived: 0,
  };
}

export async function updateCategory(
  id: string,
  input: { name?: string; icon_key?: string; color?: string },
): Promise<void> {
  const db = await getDb();
  const current = await db.getFirstAsync<Category>(
    "SELECT * FROM categories WHERE id = ?",
    id,
  );
  if (!current) throw new Error("Category not found");

  await db.runAsync(
    `UPDATE categories SET name = ?, icon_key = ?, color = ? WHERE id = ?`,
    input.name?.trim() || current.name,
    input.icon_key ?? current.icon_key,
    input.color ?? current.color,
    id,
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  const usage = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM records WHERE category_id = ?",
    id,
  );
  if ((usage?.count ?? 0) > 0) {
    throw new Error("Cannot delete a category that has records.");
  }
  const budgets = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM budgets WHERE category_id = ?",
    id,
  );
  if ((budgets?.count ?? 0) > 0) {
    throw new Error("Cannot delete a category that has budgets.");
  }
  await db.runAsync("DELETE FROM categories WHERE id = ?", id);
}

export async function ignoreCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE categories SET archived = 1 WHERE id = ?", id);
}
