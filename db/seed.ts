import type { SQLiteDatabase } from "expo-sqlite";

import { createId } from "@/lib/id";

const DEFAULT_ACCOUNTS = [
  { name: "Cash", icon_key: "cash", opening_balance: 0 },
  { name: "Primary", icon_key: "card", opening_balance: 0 },
  { name: "Savings", icon_key: "piggy", opening_balance: 0 },
] as const;

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon_key: "restaurant", color: "#E53935" },
  { name: "Transportation", icon_key: "bus", color: "#1E88E5" },
  { name: "Bills", icon_key: "document", color: "#212121" },
  { name: "Shopping", icon_key: "cart", color: "#3949AB" },
  { name: "Health", icon_key: "heart", color: "#F4511E" },
  { name: "Home", icon_key: "home", color: "#D81B60" },
  { name: "Entertainment", icon_key: "film", color: "#8E24AA" },
  { name: "Education", icon_key: "school", color: "#1565C0" },
  { name: "Social", icon_key: "people", color: "#43A047" },
  { name: "Sport", icon_key: "tennisball", color: "#2E7D32" },
  { name: "Telephone", icon_key: "phone-portrait", color: "#C0CA33" },
  { name: "Clothing", icon_key: "shirt", color: "#FB8C00" },
  { name: "Loan", icon_key: "cash", color: "#6A1B9A" },
] as const;

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon_key: "wallet", color: "#EC407A" },
  { name: "Awards", icon_key: "trophy", color: "#1E88E5" },
  { name: "Refunds", icon_key: "refresh", color: "#43A047" },
  { name: "Rental", icon_key: "home", color: "#8E24AA" },
  { name: "Sale", icon_key: "pricetag", color: "#7CB342" },
  { name: "Grants", icon_key: "gift", color: "#00897B" },
] as const;

/** Seed defaults once when accounts table is empty. */
export async function seedDefaultsIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM accounts",
  );
  if ((row?.count ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    let order = 0;
    for (const account of DEFAULT_ACCOUNTS) {
      await db.runAsync(
        `INSERT INTO accounts (id, name, icon_key, opening_balance, sort_order, archived)
         VALUES (?, ?, ?, ?, ?, 0)`,
        createId("acc"),
        account.name,
        account.icon_key,
        account.opening_balance,
        order++,
      );
    }

    order = 0;
    for (const category of DEFAULT_INCOME_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (id, name, type, icon_key, color, sort_order)
         VALUES (?, ?, 'income', ?, ?, ?)`,
        createId("cat"),
        category.name,
        category.icon_key,
        category.color,
        order++,
      );
    }

    order = 0;
    for (const category of DEFAULT_EXPENSE_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (id, name, type, icon_key, color, sort_order)
         VALUES (?, ?, 'expense', ?, ?, ?)`,
        createId("cat"),
        category.name,
        category.icon_key,
        category.color,
        order++,
      );
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      "seeded_defaults",
      "true",
    );
  });
}
