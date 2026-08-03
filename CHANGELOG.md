# Changelog

All notable changes to **Fredkin** are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/) — see [`docs/VERSIONING.md`](docs/VERSIONING.md).

## [Unreleased]

### Added

- Native More: header menu, larger plain edge pill, edge swipe-in; Back from Settings/Data reopens the drawer
- Event row swipe: right = Edit, left = Delete; in-app delete confirm
- Verbose `__DEV__` logging trail (nav / UI); prod keeps milestones for Export Logs
- `expo-dev-client` + EAS `development` APK profile for live Metro on device
- Demo fixture [`fixtures/demo_ledger_3years.csv`](fixtures/demo_ledger_3years.csv) (~5.6k fictional rows for safe demos / import QA)

### Changed

- Product / repo rebrand to **Fredkin** ([nandgatelabs/fredkin](https://github.com/nandgatelabs/fredkin)): UI chrome, npm/desktop package names, Expo slug/scheme, Android package `labs.nandgatelabs.fredkin`, export folder and CSV/`.mbak` filenames
- SQLite file remains `money-money.db` so existing local ledgers keep working
- Native dismiss chrome: chevron Back / icon Close; composer **Discard** / **Save**
- Web dialogs: Search/More stack, Back/Close, Esc behavior

### Fixed

- Expense/income flow line chart point selection on web; keep selected days when the series is sampled
- Flow calendar renders every month in 3/6/yearly ranges
- Decimal places capped at 0–4; All Accounts balance uses consistent money formatting
- Android SQLite dead handle after JS reload (`useNewConnection`, `withDb` retry); export/save fallbacks when settings read fails

### Planned

- See [`docs/ROADMAP.md`](docs/ROADMAP.md); GitHub Release tag/upload runs from `main` after merge.

## [1.0.0] — 2026-08-01

First public **v1** baseline: offline personal finance on web and Ubuntu desktop.

### Added

- Full offline ledger: expenses, income, transfers; accounts and categories with icons
- Records list with period modes (day → year, including 3/6 months) and carry-over
- Add-record composer with calculator-style amount entry
- Search; CSV import/export; `.mbak` backup/restore; wipe data
- Analysis: overview, flow, calendar, account bars
- Budgets by category; preferences (themes, UI mode, passcode, daily remind on web)
- Account and category detail screens
- Ubuntu desktop shell (Electron): `npm run desktop:install-user` installs into the app grid with persistent local data (`~/.config/Fredkin`)
- Project docs: HLD, BLUEPRINT, DEVELOPMENT, DESKTOP; MIT license and community files

### Notes

- Public web hosting and store/mobile packaging are out of scope for 1.0.0 (see roadmap).
- Deferred polish tracked as GitHub issues (#16, #19–#23, and older deferred bugs).

[Unreleased]: https://github.com/nandgatelabs/fredkin/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/nandgatelabs/fredkin/releases/tag/v1.0.0
