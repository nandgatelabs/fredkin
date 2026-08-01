# Fredkin — Feature Blueprint

> Screen-by-screen product spec for v1.  
> Product: **Fredkin by NandGateLabs**. Repo paths may still say `money-money`.  
> Architecture & delivery: [`HLD.md`](./HLD.md).  
> Agents: treat this as the UI/behavior checklist.

---

## Summary

Offline personal finance ledger: dark charcoal UI, cream-gold accents, ₹ formatting by default.

| Surface | Role |
|---------|------|
| 4 tabs | Events · Insights · Wallets · Event Type (Budgets unlinked from nav) |
| Shell | Hamburger drawer, search, FAB `+` |
| Event types | Spend · Income · Transfer |
| Insights | Donut by type, timeline + calendar, wallet bars |
| Management | Settings, Data (Export / Import / Backup / Restore), Support, Reset |

All features unlocked — including multi-month and yearly period views, themes, passcode, and full icons.

SQLite / CSV on-disk TYPE strings stay `expense` / `income` for compatibility; UI shows **Spend** / **Income**.

---

## 1. App shell

Persistent chrome on main tabs:

- **Top bar:** hamburger · **Fredkin** wordmark · search
- **Bottom nav:** 4 tabs (active = gold highlight)
- **FAB:** dark circle, gold `+` → add event

### Drawer

| Item | Destination |
|------|-------------|
| Settings | Preferences screen (title: Settings) |
| Data | Hub → Export, Import, Backup, Restore |
| Support | Help / feedback links |
| Reset | Wipe options |
| Export Logs | Local debug log file |

Attribution line: **Fredkin by NandGateLabs**.

---

## 2. Events (home ledger)

### Period & summary

- Chevrons navigate period; filter icon opens **Display options**.
- Summary: **SPEND** (coral) · **INCOME** (green) · **NET** (signed color).

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
- **Defaults:** account and category start blank (placeholder “Account” / “Category”); notes empty (“Add notes”); amount `0`
- Custom calculator keypad: `0–9`, `.`, `+ − × ÷ =`, backspace
- Footer: tappable date + time → calendar / clock modals
- Validation: amount > 0; **account required** (transfer: both From and To, and From ≠ To); **category optional** for income/expense
- Save: write record + update balances in one transaction

### Account picker

List: icon · name · live balance (green/red).

### Category picker

- 3-column grid of colored circles + labels.
- Filtered by Income vs Expense type.
- Footer: **+ ADD NEW CATEGORY**

### Record detail modal (tap a row on Records)

Refs: `private/new/record-detail-expense-modal.jpeg`

- Coral/expense (or green/income, blue/transfer) header: close · delete · edit · type label · large signed amount · date/time
- Body: Account pill · Category pill · note text
- Edit opens the composer prefilled; delete confirms then removes record

#### Default income categories

Awards, Coupons, Grants, Lottery, Refunds, Rental, Salary, Sale, …

#### Default expense categories

Bills, Clothing, Education, Electronics, Entertainment, Food, Health, Home, Loan, Shopping, Social, Sport, Telephone, Transportation, …

---

## 5. Insights

Same period header + SPEND/INCOME/NET as Events.

Mode dropdown:

| Mode | UI |
|------|-----|
| Expense by type | Donut + legend + event-type rows (amount, % bar, %) |
| Income by type | Same, green amounts |
| Expense timeline | Line chart by day + calendar cells with day totals |
| Income timeline | Green line + calendar income overlays |
| Wallet breakdown | Grouped bars (Spend vs Income per wallet) + period chips |

FAB still opens add-event.

---

## 6. Budgets (hidden from nav; code retained)

- Month selector; **TOTAL BUDGET** (gold) + **TOTAL SPENT** (coral).
- **Budgeted categories:** card — Limit / Spent / Remaining, progress bar, period tag, `⋯` menu.
- Status: `*Budget expired`, `*Limit exceeded`.
- **Not budgeted this month:** category + **SET BUDGET**.
- Empty copy when none set: suggest set or copy from past months.
- Entity: per category per calendar month.

---

## 7. Wallets

- Header: `[ All Wallets ₹… ]` + **SPEND SO FAR** / **INCOME SO FAR**.
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

### Account details (tap an account)

Refs: `private/new/account-details-period.jpeg`, `private/new/account-details-all-time.jpeg`

- Header: close · “Account details” · period subtitle (“Time selected: …” or “Records: All time”)
- Identity: icon · name · current balance (and initial balance when all-time)
- Period mode: starting balance · expense/income + % of period · transfers in/out · ending balance
- All-time mode: info callout pointing to Analysis for period stats
- Record list for that account (date groups or day column) with sort NEW TO OLD

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

### Category details (tap a category)

Refs: `private/new/category-details-expense.jpeg`, `private/new/category-details-income.jpeg`

- Header: close · “Category details” · period subtitle
- Identity: colored circle icon · name · “Expense category” / “Income category”
- Summary card: period · pie slice · “% of total … in this period” · period total amount
- Record list for that category (account + note + amount) with sort NEW TO OLD

---

## 9. Settings (Preferences route)

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
