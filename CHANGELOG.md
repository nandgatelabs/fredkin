# Changelog

All notable changes to **money-money** are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/) — see [`docs/VERSIONING.md`](docs/VERSIONING.md).

## [Unreleased]

### Fixed

- Expense/income flow line chart point selection on web; keep selected days when the series is sampled
- Flow calendar renders every month in 3/6/yearly ranges
- Decimal places capped at 0–4; All Accounts balance uses consistent money formatting

### Added

- CSV export From/To date range (defaults to this month; All time available)
- Backup restore list of `.mbak` files in the save folder; web Save As dialog when no folder is chosen
- Drawer Help / Feedback; Preferences Privacy and MIT License screens
- Native daily remind via `expo-notifications` (≈7 PM local)
- Electron pack targets for Windows (NSIS/portable) and macOS (dmg/zip)
- Docs: web hosting COOP/COEP recipe, iOS EAS notes, release artifact upload steps

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
- Ubuntu desktop shell (Electron): `npm run desktop:install-user` installs into the app grid with persistent local data (`~/.config/money-money`)
- Project docs: HLD, BLUEPRINT, DEVELOPMENT, DESKTOP; MIT license and community files

### Notes

- Public web hosting and store/mobile packaging are out of scope for 1.0.0 (see roadmap).
- Deferred polish tracked as GitHub issues (#16, #19–#23, and older deferred bugs).

[Unreleased]: https://github.com/nandgatelabs/money-money/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/nandgatelabs/money-money/releases/tag/v1.0.0
