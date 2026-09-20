export const PERSON_ROLES = [
  "with",
  "gift",
  "they_owe",
  "you_owe",
  "settled",
] as const;

export type PersonRole = (typeof PERSON_ROLES)[number];

export function isPersonRole(value: string | null | undefined): value is PersonRole {
  return PERSON_ROLES.includes(value as PersonRole);
}

/** Roles that are still spend/income (not an IOU). */
export function isLifestyleRole(role: string | null | undefined): boolean {
  return role == null || role === "with" || role === "gift";
}

export function personRoleLabel(role: PersonRole): string {
  switch (role) {
    case "with":
      return "With";
    case "gift":
      return "Gift";
    case "they_owe":
      return "They owe";
    case "you_owe":
      return "You owe";
    case "settled":
      return "Settled";
  }
}

/** Names to match when attaching a type after picking a person with none selected. */
export function defaultCategoryNameHints(
  role: PersonRole,
  recordType: "income" | "expense",
): string[] {
  if (recordType === "income") {
    if (role === "gift") return ["gift", "grants", "awards"];
    if (role === "you_owe" || role === "settled") return ["loan", "grants"];
    return ["grants", "awards"];
  }
  if (role === "gift") return ["gift", "social"];
  if (role === "they_owe" || role === "you_owe" || role === "settled") {
    return ["loan", "social"];
  }
  return ["social"];
}

export function pickDefaultCategory<T extends { name: string }>(
  categories: T[],
  role: PersonRole,
  recordType: "income" | "expense" | "transfer",
): T | null {
  if (recordType === "transfer" || categories.length === 0) return null;
  const hints = defaultCategoryNameHints(role, recordType);
  for (const hint of hints) {
    const found = categories.find((c) => c.name.toLowerCase().includes(hint));
    if (found) return found;
  }
  return categories[0] ?? null;
}

export function defaultRoleForCategory(name: string | null | undefined): PersonRole {
  const n = (name ?? "").trim().toLowerCase();
  if (n.includes("gift")) return "gift";
  if (n.includes("loan")) return "they_owe";
  return "with";
}

export function parsePersonRole(raw: string | null | undefined): PersonRole | null {
  if (raw == null || !raw.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (key === "theyowe" || key === "they_owe_you") return "they_owe";
  if (key === "youowe" || key === "you_owe_them") return "you_owe";
  if (isPersonRole(key)) return key;
  return null;
}

/** SQL predicate: counts toward SPEND/INCOME. `alias` empty = unprefixed columns. */
export function sqlLifestyle(alias = ""): string {
  const p = alias ? `${alias}.` : "";
  return `(IFNULL(${p}is_adjustment, 0) = 0 AND (${p}person_id IS NULL OR IFNULL(${p}person_role, 'with') IN ('with', 'gift')))`;
}

export function isAdjustmentFlag(value: number | boolean | null | undefined): boolean {
  return value === 1 || value === true;
}

export type PersonClaimTotals = {
  theyOwe: number;
  youOwe: number;
  spentOn: number;
};

export function emptyPersonClaimTotals(): PersonClaimTotals {
  return { theyOwe: 0, youOwe: 0, spentOn: 0 };
}

/**
 * Claims follow the role, not the spend/income tab.
 * Settled income reduces they-owe; settled spend/transfer reduces you-owe.
 */
export function addRecordToPersonClaims(
  totals: PersonClaimTotals,
  record: { type: string; amount: number; person_role?: string | null },
): void {
  const role = record.person_role ?? "with";
  if (role === "they_owe") totals.theyOwe += record.amount;
  else if (role === "you_owe") totals.youOwe += record.amount;
  else if (role === "settled") {
    if (record.type === "income") totals.theyOwe -= record.amount;
    else totals.youOwe -= record.amount;
  } else if (record.type === "expense" && (role === "with" || role === "gift")) {
    totals.spentOn += record.amount;
  }
}

export function summarizePersonRecords(
  records: { type: string; amount: number; person_role?: string | null }[],
): PersonClaimTotals {
  const totals = emptyPersonClaimTotals();
  for (const record of records) addRecordToPersonClaims(totals, record);
  return totals;
}
