/** Minimal quoted-CSV parser for MyMoney-style exports. */

export type CsvRow = {
  time: string;
  type: string;
  amount: string;
  category: string;
  account: string;
  notes: string;
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip trailing empty line
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      pushField();
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (ch === "\r") continue;
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }
  return rows;
}

export function parseMoneyCsv(text: string): CsvRow[] {
  const grid = parseCsv(text);
  if (grid.length === 0) return [];

  const header = grid[0].map((h) => h.trim().replace(/^"|"$/g, "").toUpperCase());
  const idx = {
    time: header.indexOf("TIME"),
    type: header.indexOf("TYPE"),
    amount: header.indexOf("AMOUNT"),
    category: header.indexOf("CATEGORY"),
    account: header.indexOf("ACCOUNT"),
    notes: header.indexOf("NOTES"),
  };
  if (Object.values(idx).some((v) => v < 0)) {
    throw new Error(
      "CSV must have columns: TIME, TYPE, AMOUNT, CATEGORY, ACCOUNT, NOTES",
    );
  }

  const out: CsvRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    if (!cells || cells.every((c) => !c.trim())) continue;
    out.push({
      time: (cells[idx.time] ?? "").trim(),
      type: (cells[idx.type] ?? "").trim(),
      amount: (cells[idx.amount] ?? "").trim(),
      category: (cells[idx.category] ?? "").trim(),
      account: (cells[idx.account] ?? "").trim(),
      notes: (cells[idx.notes] ?? "").trim(),
    });
  }
  return out;
}

/** Parse "Mar 01, 2024 6:39 PM" style timestamps. */
export function parseCsvTime(raw: string): Date {
  const cleaned = raw.trim();
  const d = new Date(cleaned);
  if (!Number.isNaN(d.getTime())) return d;

  const m = cleaned.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  );
  if (!m) throw new Error(`Unrecognized TIME: ${raw}`);
  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const month = months[m[1].toLowerCase()];
  if (month == null) throw new Error(`Unrecognized month in TIME: ${raw}`);
  let hour = Number(m[4]);
  const minute = Number(m[5]);
  const ampm = m[6].toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return new Date(Number(m[3]), month, Number(m[2]), hour, minute, 0, 0);
}

export function parseTransferAccounts(accountField: string): {
  from: string;
  to: string;
} {
  const parts = accountField.split("->").map((s) => s.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Transfer ACCOUNT must be From->To, got: ${accountField}`);
  }
  return { from: parts[0], to: parts[1] };
}
