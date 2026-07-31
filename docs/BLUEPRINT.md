# money-money — Feature Blueprint

> Screen-by-screen product spec for v1.  
> Architecture & delivery: [`HLD.md`](./HLD.md).  
> Agents: treat this as the UI/behavior checklist.

---

## Summary

Offline personal finance ledger: dark charcoal UI, cream-gold accents, ₹ formatting by default.

| Surface | Role |
|---------|------|
| 5 tabs | Records · Analysis · Budgets · Accounts · Categories |
| Shell | Hamburger drawer, search, FAB `+` |
| Record types | Expense · Income · Transfer |
| Analysis | Donut overview, flow line + calendar, account bars |
| Management | Preferences, CSV export, `.mbak` backup/restore, delete/reset |

All features unlocked — including multi-month and yearly period views, themes, passcode, and full icons.

---

## 1. App shell

Persistent chrome on main tabs:

- **Top bar:** hamburger · wordmark · search
- **Bottom nav:** 5 tabs (active = gold highlight)
- **FAB:** dark circle, gold `+` → add record

### Drawer

| Item | Destination |
|------|-------------|
| Preferences | Settings screen |
| Export records | Date-range CSV export |
| Backup & Restore | `.mbak` backup/restore/directory |
| Delete & Reset | Wipe options |
| Help / Feedback | Optional for OSS |

---

## 2. Records (home ledger)

### Period & summary

- Chevrons navigate period; filter icon opens **Display options**.
- Summary: **EXPENSE** (coral) · **INCOME** (green) · **TOTAL** (signed color).

### Display options

| Control | Values |
|---------|--------|
| View mode | DAILY, WEEKLY, MONTHLY, 3 MONTHS, 6 MONTHS, YEARLY — all unlocked |
| Show total | YES / NO |
| Carry over | ON / OFF — “monthly surplus added to next month” |

### List

- Grouped by date header (`Jul 31, Friday`).
- Row: category icon · name · account chip · quoted note · signed amount.
- Transfer: From → To, blue amount, no category.
- Tap row → edit; FAB → add.

---

## 3. Search

- Empty: illustration + “Search records by notes, category name or account name”.
- Query: case-insensitive substring on note, category name, account name.
- Header: `Total N matches found`.
- Result row: icon, category, account, amount, `date • note`; highlight match spans.

---

## 4. Add / Edit record (composer)

- Header: **CANCEL** | **SAVE**
- Tabs: **INCOME | EXPENSE | TRANSFER**
- Expense/Income: Account + Category pickers, notes
- Transfer: From Account + To Account (no category)
- Custom calculator keypad: `0–9`, `.`, `+ − × ÷ =`, backspace
- Footer: tappable date + time → calendar / clock modals
- Validation: amount > 0; account required; category required except transfer; from ≠ to
- Save: write record + update balances in one transaction

### Account picker

List: icon · name · live balance (green/red).

### Category picker

- 3-column grid of colored circles + labels.
- Filtered by Income vs Expense type.
- Footer: **+ ADD NEW CATEGORY**

#### Default income categories

Awards, Coupons, Grants, Lottery, Refunds, Rental, Salary, Sale, …

#### Default expense categories

Bills, Clothing, Education, Electronics, Entertainment, Food, Health, Home, Loan, Shopping, Social, Sport, Telephone, Transportation, …

---

## 5. Analysis

Same period header + EXPENSE/INCOME/TOTAL as Records.

Mode dropdown:

| Mode | UI |
|------|-----|
| Expense Overview | Donut + legend + category rows (amount, % bar, %) |
| Income Overview | Same, green amounts |
| Expense Flow | Line chart by day + calendar cells with day totals |
| Income Flow | Green line + calendar income overlays |
| Account Analysis | Grouped bars (Expense vs Income per account) + period chips |

FAB still opens add-record.

---

## 6. Budgets

- Month selector; **TOTAL BUDGET** (gold) + **TOTAL SPENT** (coral).
- **Budgeted categories:** card — Limit / Spent / Remaining, progress bar, period tag, `⋯` menu.
- Status: `*Budget expired`, `*Limit exceeded`.
- **Not budgeted this month:** category + **SET BUDGET**.
- Empty copy when none set: suggest set or copy from past months.
- Entity: per category per calendar month.

---

## 7. Accounts

- Header: `[ All Accounts ₹… ]` + **EXPENSE SO FAR** / **INCOME SO FAR**.
- Card (gold border): illustrative icon · name · `Balance:` (signed color) · `⋯`.
- **+ ADD NEW ACCOUNT** ghost button at list end (and FAB still available).
- Balance = opening + income − expense ± transfers.

### Account `⋯` menu

**Edit** · **Delete** · **Ignore** (Ignore = hide/archive from list; data kept).

### Add / Edit account modal

| Field | Behavior |
|-------|----------|
| Initial amount | Number input; note: *Initial amount will not be reflected in analysis* |
| Name | Text (default “Untitled” on create) |
| Icon | Horizontal picker: cash, card, piggy, mastercard-style, visa-style |
| Actions | **CANCEL** · **SAVE** |

---

## 8. Categories

- Same all-accounts summary header as Accounts.
- Sections: **Income categories** then **Expense categories**.
- Row: colored circle icon · name · `⋯`.
- **+ ADD NEW CATEGORY** CTA.

### Category `⋯` menu

**Edit** · **Delete** · **Ignore** (Ignore = hide from lists).

### Add new category modal

| Field | Behavior |
|-------|----------|
| Type | **INCOME** \| **EXPENSE** (radio with check on selected) |
| Name | Text (default “Untitled”) |
| Icon | Grid of colored category glyphs (scrollable set) |
| Actions | **CANCEL** · **SAVE** |

### Edit category modal

Same as add, but **without** type switch (type is fixed after create): Name + Icon + CANCEL/SAVE.

---

## 9. Preferences

| Section | Settings |
|---------|----------|
| Appearance | UI mode, theme, currency sign/position, decimal places, notes in record list toggle |
| Security | Passcode protection |
| Notification | Remind everyday toggle; link to system notification settings |
| About | Version, license/privacy links; optional crash stats (default **off**) |

---

## 10. Export / Backup / Reset

### Export records

- From / To dates → **EXPORT NOW** → CSV.
- Note: exported CSV is not a full backup.

### Backup & Restore

- **BACKUP NOW** · **RESTORE** · **SELECT/CHANGE DIRECTORY**
- Backup includes records, categories, accounts, budgets, settings.
- Restore lists `.mbak` files with modified timestamps.

### Delete & Reset

1. **Delete all records** — keep accounts, categories, budgets  
2. **Delete all** — records + accounts + categories + budgets  
3. **Reset all** — factory initial state  

---

## 11. Visual system

| Token | Role |
|-------|------|
| Charcoal ~`#2C2B27` | Background |
| Cream-gold ~`#E5D38A` | Accent text/icons/active |
| Coral ~`#E88F78` | Expense / negative |
| Mint green | Income / positive |
| Light blue | Transfer amounts |
| Expressive display font | Brand wordmark only |

Patterns: period chevrons + filter; category = colored circle + white glyph; account = square illustrative icon; ghost outline CTAs for export/backup/add.

---

## 12. CSV shape

When importing a local worksheet (kept under gitignored `private/`):

```
TIME, TYPE, AMOUNT, CATEGORY, ACCOUNT, NOTES
```

TYPE values: `(-) Expense`, `(+) Income`, `(*) Transfer`.  
Transfers: `ACCOUNT` = `From->To`, category blank.

---

## 13. Acceptance checklist

- [ ] Five tabs + drawer + search + FAB add flow  
- [ ] Three record types with calculator and date/time  
- [ ] Period aggregation Daily → Yearly (incl. 3/6) + carry-over toggle  
- [ ] No paywall / upgrade UI anywhere  
- [ ] Analysis: overview donuts, flow lines, day calendar, account bars  
- [ ] Budgets with spent vs limit progress  
- [ ] Account balances and lifetime expense/income headers  
- [ ] CSV export + local backup/restore + wipe options  
- [ ] Optional: import local CSV for migration testing  

---

## 14. Out of scope unless requested

Cloud sync · SMS/bank scraping · multi-currency FX · in-app purchases · homescreen widget (unless easy).
