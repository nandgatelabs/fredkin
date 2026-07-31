# money-money — High Level Design (HLD)

> Source of truth for architecture. Pair with [`BLUEPRINT.md`](./BLUEPRINT.md) for UI/feature detail.  
> Stack: **Expo · React Native · TypeScript · expo-sqlite · expo-router · Zustand**  
> Status: HLD v1 · Offline-only · No paywall · MIT licensed

---

## 1. Goals & constraints

### Goals

- Fast, smooth offline tracking of expenses, income, and transfers.
- Clear analysis (charts + calendar) and monthly category budgets.
- Multiple accounts with live balances.
- Data never leaves the phone unless the user exports or backs up.
- Optional CSV import for migrating an existing ledger.
- All features unlocked — no premium tiers.

### Constraints / non-goals (v1)

- No cloud sync, auth, or multi-device merge.
- No bank/SMS scraping.
- No in-app purchases.
- Android-first; iOS optional later.
- Homescreen widget deferred unless trivial in Expo.

### Product decisions

| Decision | Behavior |
|----------|----------|
| View modes (daily → yearly, incl. 3/6 months) | Always available |
| Themes | Available in Preferences |
| Passcode | Available (local app lock) |
| Icon pack | Full set unlocked |
| Paywall / upgrade UI | Never shown |

---

## 2. System context

Single mobile client. OS services only: local filesystem (backup/export), optional local notifications, date/time pickers.

| Actor / system | Interaction |
|----------------|-------------|
| User | CRUD records, budgets, accounts, categories; view analysis |
| Device SQLite | Source of truth for all domain data |
| Device filesystem | Write/read `.csv` export and `.mbak` backup |
| Share sheet | Hand exported/backed-up files to other apps |
| Local notifications | Optional daily “add expense” reminder |

```
┌─────────────┐     CRUD / views      ┌──────────────────┐
│    User     │◄─────────────────────►│  Expo App (UI)   │
└─────────────┘                       └────────┬─────────┘
                                               │ use-cases
                                      ┌────────▼─────────┐
                                      │ Domain + App svc │
                                      └────────┬─────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌────────────┐      ┌──────────────┐     ┌─────────────┐
                   │  SQLite    │      │ File system  │     │ Local notif │
                   └────────────┘      │ csv / mbak   │     └─────────────┘
                                       └──────────────┘
```

---

## 3. Architecture (layers)

Strict dependency direction: **UI → application → domain → persistence**. No UI talking to SQL directly.

| Layer | Responsibility | Tech |
|-------|----------------|------|
| Presentation | Screens, navigation, theme, charts, forms | expo-router, RN, chart lib |
| Application | Use-cases: addRecord, setBudget, exportCsv, restoreBackup, periodTotals | TS modules + Zustand (UI/session) |
| Domain | Types, money math, period ranges, carry-over, balance rules | Pure TypeScript (testable) |
| Persistence | Schema, migrations, queries, import/export codecs | expo-sqlite + file-system |

### Runtime shape

1. Boot → open DB → migrations → load settings → hydrate period store → render tabs.
2. Mutations go through use-case functions that open a transaction, write rows, update balances, notify UI stores.
3. Heavy aggregates (analysis, large search) run as SQL `GROUP BY` / indexed queries; UI renders prepared view models.

---

## 4. Module map

| Module | Owns | Key interfaces |
|--------|------|----------------|
| `shell` | Tabs, drawer, top bar, FAB, theme | `navigate(tab)`, `openDrawer()`, `openAddRecord()` |
| `records` | Ledger list, display options, period header | `listByPeriod()`, `updateDisplayOptions()` |
| `composer` | Add/edit Income\|Expense\|Transfer + calculator | `saveRecord()`, `validateComposer()` |
| `search` | Filter over note/category/account | `searchRecords(query)` |
| `analysis` | Overview / Flow / Account analysis VMs | `getAnalysis(mode, period)` |
| `budgets` | Monthly limits vs spent | `setBudget()`, `listBudgets(month)` |
| `accounts` | Account CRUD + balances | `createAccount()`, `getBalances()` |
| `categories` | Income/expense taxonomy + icons | `createCategory()`, `listByType()` |
| `settings` | Preferences | `getSetting()`, `setSetting()` |
| `portability` | CSV, `.mbak`, wipe | `exportCsv()`, `backup()`, `restore()`, `reset()` |
| `entitlements` | Feature flags — all ON | `isEnabled(feature)` → always `true` for v1 |

---

## 5. Navigation architecture

### Root stack

- `(tabs)` | `search` | `record/new` | `record/[id]`
- Modals: account-picker, category-picker
- Drawer destinations: preferences, export, backup, delete-reset

### Tabs

`records` · `analysis` · `budgets` · `accounts` · `categories`

- Shared `PeriodHeader` on records / analysis / budgets.
- Global FAB → composer (default type: Expense).

---

## 6. Data architecture

### Entities

| Entity | Relationships | Invariants |
|--------|---------------|------------|
| Account | 1 → N Record (as account or to_account) | Name unique; balance = opening + Σ effects |
| Category | 1 → N Record; 1 → N Budget | `type ∈ income\|expense`; transfers have no category |
| Record | Account; optional Category; optional to_account | `amount > 0`; transfer requires `to_account ≠ account` |
| Budget | Category × (year, month) | One limit per category per month |
| Setting | key/value | viewMode, carryOver, currency, decimals, … |

### Suggested SQLite tables

```sql
accounts(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon_key TEXT NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0
);

categories(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  icon_key TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

records(
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('expense','income','transfer')),
  amount REAL NOT NULL CHECK(amount > 0),
  category_id TEXT REFERENCES categories(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  to_account_id TEXT REFERENCES accounts(id),
  note TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL  -- ISO-8601
);

budgets(
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  limit_amount REAL NOT NULL CHECK(limit_amount >= 0),
  UNIQUE(category_id, year, month)
);

settings(
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL  -- JSON
);
```

### Indexes

- `records(occurred_at)`
- `records(category_id, occurred_at)`
- `records(account_id, occurred_at)`
- `budgets(year, month, category_id)` UNIQUE already
- Search: `LIKE` on note + joins to category/account names (FTS optional later)

### Record effects on balance

| Type | Account effect | Period totals |
|------|----------------|---------------|
| Expense | −amount on `account_id` | +EXPENSE |
| Income | +amount on `account_id` | +INCOME |
| Transfer | −from `account_id`, +to `to_account_id` | Excluded from EXPENSE/INCOME |

### Period engine

- `viewMode ∈ daily | weekly | monthly | months3 | months6 | yearly` — all unlocked.
- Period cursor stores an anchor date; range derived by mode; chevrons shift one unit.
- Carry-over ON: previous monthly surplus (`income − expense`) folds into displayed TOTAL for the current month (chain as needed).

---

## 7. Key flows

| Flow | Steps |
|------|-------|
| Add expense | FAB → composer → account/category → keypad → date/time → SAVE → txn → balances → Records |
| Transfer | Composer TRANSFER → From/To → amount → SAVE → dual balance; list shows blue amount |
| Change period | Chevron or Display options → period store → re-query Records/Analysis/Budgets |
| Analysis | Select mode → SQL aggregates → chart + list VM → render |
| Set budget | Budgets → SET BUDGET → upsert → recompute spent/remaining |
| CSV import | Parse CSV → upsert accounts/categories → batch insert records |
| Backup | Serialize all domain tables + settings → `.mbak` JSON → write/share |
| Restore | Pick `.mbak` → confirm → wipe domain tables → import → restart stores |

---

## 8. Portability formats

### CSV (export / import)

Columns: `TIME`, `TYPE`, `AMOUNT`, `CATEGORY`, `ACCOUNT`, `NOTES`

| TYPE marker | Meaning |
|-------------|---------|
| `(-) Expense` | Expense |
| `(+) Income` | Income |
| `(*) Transfer` | Transfer; `ACCOUNT` is `From->To`; category blank |

Not a backup (cannot fully restore accounts/budgets/settings from CSV alone).

### Backup (`.mbak`)

- Versioned JSON.
- Includes: records, accounts, categories, budgets, settings.
- Filename pattern: `money-money-backup_DD_MM_YY_XXX.mbak`.
- Real user exports live under gitignored `private/` and must never be committed.

---

## 9. UI / UX architecture

- **Tokens:** bg charcoal, accent cream-gold, expense coral, income green, transfer blue.
- **Logo:** distinctive wordmark for “money-money” (expressive font; not a default system stack).
- **Shared components:** `PeriodHeader`, `SummaryTriple`, `RecordRow`, `AmountText`, `CalculatorKeypad`, `CategoryIcon`, `AccountIcon`, `EmptyState`, `GhostButton`, `DisplayOptionsModal`.
- **Lists:** virtualized (`FlashList` / `FlatList`) with date section headers.

---

## 10. Non-functional requirements

| NFR | Target |
|-----|--------|
| Offline | All features work in airplane mode |
| Cold start | < 2s interactive on mid Android with ~2k records |
| List scroll | 60fps target; virtualized lists |
| Durability | SQLite transactions for multi-row writes |
| Privacy | No analytics/crash upload by default |
| Backup safety | Restore requires confirm; export never deletes data |
| Money format | INR default; configurable symbol/position/decimals |

---

## 11. Risks

- Data at rest is as safe as the device; passcode is app-lock, not full DB encryption in v1 unless requested.
- Backup files contain full finance history — warn before share.
- CSV import must be batched; bad rows reported without failing the entire file silently.

---

## 12. Suggested package layout

```
app/
  (tabs)/          # records, analysis, budgets, accounts, categories
  record/          # new + [id]
  search.tsx
  preferences.tsx
  export.tsx
  backup.tsx
  reset.tsx
db/                # schema, migrations, queries, import-csv
store/             # period, settings, ui (Zustand)
components/
theme/
lib/               # money format, period ranges, carry-over, search highlight
docs/              # HLD + BLUEPRINT (this folder)
```

---

## 13. Delivery plan

| Phase | Outcome |
|-------|---------|
| P0 Shell + DB | Tabs, theme, schema, settings store |
| P1 Accounts & Categories | CRUD + icons unlocked |
| P2 Composer | Expense/Income/Transfer + balances |
| P3 Records + periods | All view modes incl. 3/6/yearly, carry-over |
| P4 Search + CSV import | Local export can be loaded |
| P5 Analysis | Overview, flow, calendar, account bars |
| P6 Budgets + portability + prefs | Budgets, export, backup, wipe, themes/passcode |

---

## 14. Process note

Ship a solid v1 baseline first, then iterate product improvements in passes. Only front-load changes that would force a rewrite (nav model, multi-currency, multi-user, etc.).
