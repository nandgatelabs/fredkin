# Changelog

All notable changes to **money-money** are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/) — see [`docs/VERSIONING.md`](docs/VERSIONING.md).

## [Unreleased]

### Planned

- See [`docs/ROADMAP.md`](docs/ROADMAP.md) and open GitHub issues.

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
