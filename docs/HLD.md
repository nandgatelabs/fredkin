# Fredkin — High Level Design (HLD)

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
| `accounts` | Account CRUD + balances + wallet check | `createAccount()`, `saveWalletCheck()` |
| `people` | Person CRUD; optional on records | `createPerson()`, `convertAccountToPerson()` |
| `occasions` | Optional folders around events | `createOccasion()`, `attachRecordsToOccasion()` |
| `categories` | Income/expense taxonomy + icons | `createCategory()`, `listByType()` |
| `settings` | Preferences | `getSetting()`, `setSetting()` |
| `portability` | CSV, `.mbak`, wipe | `exportCsv()`, `backup()`, `restore()`, `reset()` |
| `entitlements` | Feature flags — all ON | `isEnabled(feature)` → always `true` for v1 |

---

## 5. Navigation architecture

### Root stack

- `(tabs)` | `search` | `record/new` | `occasion/new` | `record/[id]`
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
| Record | Account; optional Category; optional to_account; optional Person; optional wallet-check adjustment | `amount > 0`; transfer requires `to_account ≠ account`; adjustments excluded from SPEND/INCOME |
| Person | 0–1 per Record | Optional; role `with\|gift\|they_owe\|you_owe\|settled`. IOU roles excluded from SPEND/INCOME |
| Occasion | 0–N Record members | Optional folder; members keep type/category/wallet/amount; delete unlinks |
| Budget | Category × (year, month) | One limit per category per month |
| Setting | key/value | viewMode, carryOver, currency, decimals, lastNewEventOccurredAt, … |

### Suggested SQLite tables

```sql
accounts(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon_key TEXT NOT NULL,
  opening_balance REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  last_checked_balance REAL,
  last_checked_at TEXT
);

categories(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income','expense')),
  icon_key TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

occasions(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

records(
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('expense','income','transfer')),
  amount REAL NOT NULL CHECK(amount > 0),
  category_id TEXT REFERENCES categories(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  to_account_id TEXT REFERENCES accounts(id),
  note TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,  -- ISO-8601
  person_id TEXT,
  person_role TEXT,
  is_adjustment INTEGER NOT NULL DEFAULT 0,
  occasion_id TEXT
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
- Search: `LIKE` on note + joins to category/account/person/occasion names (FTS optional later)

### Record effects on balance

| Type | Account effect | Period totals |
|------|----------------|---------------|
| Expense | −amount on `account_id` | +EXPENSE |
| Income | +amount on `account_id` | +INCOME |
| Transfer | −from `account_id`, +to `to_account_id` | Excluded from EXPENSE/INCOME |
| Adjustment (`is_adjustment=1`, stored as income or expense) | ±amount on `account_id` | Excluded from EXPENSE/INCOME |

### Period engine

- `viewMode ∈ daily | weekly | monthly | months3 | months6 | yearly` — all unlocked.
- Period cursor stores an anchor date; range derived by mode; chevrons shift one unit.
- Carry-over ON: previous monthly surplus (`income − expense`) folds into displayed TOTAL for the current month (chain as needed).

---

## 7. Key flows

| Flow | Steps |
|------|-------|
| Add expense | FAB → composer (date+time from last new event until Today) → account/category → keypad → SAVE → txn → balances → Records |
| Transfer | Composer TRANSFER → From/To → amount → SAVE → dual balance; list shows blue amount |
| Wallet check | Wallet details → CHECK WALLET → real balance → add missing event or absorb Adjustment |
| Occasion | Optional folder: native long-press +, web circled +, or More; group existing events; composer can stay to add another line |
| Change period | Chevron or Display options → period store → re-query Records/Analysis/Budgets |
| Analysis | Select mode → SQL aggregates → chart + list VM → render |
| Set budget | Budgets → SET BUDGET → upsert → recompute spent/remaining |
| CSV import | Parse CSV → upsert accounts/categories → batch insert records |
| Backup | Serialize all domain tables + settings → `.mbak` JSON → write/share |
| Restore | Pick `.mbak` → confirm → wipe domain tables → import → restart stores |

---

## 8. Portability formats

### CSV (export / import)

Columns: `TIME`, `TYPE`, `AMOUNT`, `CATEGORY`, `ACCOUNT`, `NOTES`, `PERSON`, `PERSON_ROLE`, `OCCASION`

| TYPE marker | Meaning |
|-------------|---------|
| `(-) Expense` | Expense |
| `(+) Income` | Income |
| `(*) Transfer` | Transfer; `ACCOUNT` is `From->To`; category blank |
| `(#) Opening` | Sets the account’s opening/initial balance; not a ledger record |
| `(~+) Adjustment` / `(~-) Adjustment` | Wallet-check absorb; moves balance; not spend/income |

Optional `OCCASION` column groups rows by title (same title + calendar day).

Not a full backup (budgets/settings still need `.mbak`). Opening rows make account initial balances round-trip via CSV. Web saves to the browser Downloads folder; native uses the Share sheet. (Optional choose-folder picker is parked — see GitHub issues.)

**Demo data:** [`fixtures/demo_ledger_3years.csv`](../fixtures/demo_ledger_3years.csv) is a fictional ~5.6k-row ledger for demos and import QA. Real user exports live under gitignored `private/` and must never be committed.

### Backup (`.mbak`)

- Versioned JSON.
- Includes: records, accounts, categories, people, occasions, budgets, settings.
- Version 4 JSON (v1–v3 restore still work; missing occasions default empty).
- Filename pattern: `fredkin-backup_DD_MM_YY_XXX.mbak`.
- Same download / Share path as CSV export.
- Real user exports live under gitignored `private/` and must never be committed.

### Logging

- Ring buffer + console via `lib/logger.ts`.
- **Verbose (`__DEV__`):** `debug` + `info` to Metro (navigation, UI actions).
- **Production:** buffer keeps milestones / warn / error for **Export Logs**; Preferences → Record logs toggles non-error persistence.

---

## 9. UI / UX architecture

- **Tokens:** theme families Slate (default ink + signal blue), Teal (fintech), Copper (warm graphite); expense / income / transfer semantic colors.
- **Logo:** distinctive wordmark for “Fredkin” (expressive font; not a default system stack).
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
| P0 Shell + DB | Tabs, theme, schema, settings store (done) |
| P1 Accounts & Categories | CRUD + icons unlocked (done) |
| P2 Composer | Expense/Income/Transfer + balances (done) |
| P3 Records + periods | All view modes incl. 3/6/yearly, carry-over (done) |
| P4 Search + CSV import/export | Search, CSV import/export incl. opening balances (done) |
| P5 Analysis | Overview, flow, calendar, account bars (done) |
| P6 Budgets + portability + prefs | Budgets, drawer, backup/wipe, prefs (done) |
| P7 Preferences polish | Themes / UI mode, passcode lock, daily remind (done) |
| P8 Account + Category details | Tap account/category → detail stats + record lists (done) |

**v1 baseline:** P0–P8 shipped as **1.0.0**. Further work is optional polish tracked as GitHub issues and [`ROADMAP.md`](./ROADMAP.md) — pull into a phase only when explicitly prioritized. Releases: [`VERSIONING.md`](./VERSIONING.md), [`RELEASE.md`](./RELEASE.md), [`CHANGELOG.md`](../CHANGELOG.md).

### Desktop packaging (Ubuntu)

Offline desktop is the Expo **web** static export wrapped in Electron (`desktop/`). Install for Ubuntu via `npm run desktop:install-user` (unpacked app + `.desktop` launcher). Public web hosting remains parked. See [`DESKTOP.md`](./DESKTOP.md).

### Deferred / roadmap issues (post–v1)

Full table: [`ROADMAP.md`](./ROADMAP.md). Highlights:

| Issue | Topic |
|-------|--------|
| [#33](https://github.com/nandgatelabs/fredkin/issues/33) | Publish GitHub Release v1.0.0 |
| [#27](https://github.com/nandgatelabs/fredkin/issues/27) | Attach Ubuntu AppImage/`.deb` to Releases |
| [#19](https://github.com/nandgatelabs/fredkin/issues/19) | CSV export From/To date range |
| [#20](https://github.com/nandgatelabs/fredkin/issues/20) | Backup directory + `.mbak` restore list |
| [#21](https://github.com/nandgatelabs/fredkin/issues/21) | Optional Help / Feedback drawer entry |
| [#22](https://github.com/nandgatelabs/fredkin/issues/22) | About: privacy + license links |
| [#23](https://github.com/nandgatelabs/fredkin/issues/23) | Daily remind on native (iOS/Android) |
| [#28](https://github.com/nandgatelabs/fredkin/issues/28) | Windows desktop shell |
| [#29](https://github.com/nandgatelabs/fredkin/issues/29) | macOS desktop shell |
| [#30](https://github.com/nandgatelabs/fredkin/issues/30) | Android EAS / store packaging |
| [#31](https://github.com/nandgatelabs/fredkin/issues/31) | iOS EAS / store packaging (optional) |
| [#32](https://github.com/nandgatelabs/fredkin/issues/32) | Public web hosting (COOP/COEP) |
| [#16](https://github.com/nandgatelabs/fredkin/issues/16) | Web save-location picker (parked) |

Earlier analysis/preferences bug issues (#12–#15) remain deferred indefinitely unless explicitly scheduled.

---

## 14. Process note

Ship a solid v1 baseline first, then iterate product improvements in passes. Only front-load changes that would force a rewrite (nav model, multi-currency, multi-user, etc.).
