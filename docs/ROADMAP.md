# Roadmap

Living plan after **v1.0.0**. Priorities change when a maintainer schedules work; open issues are not automatic commitments.

## Shipped — v1.0.0

- Offline ledger (records, accounts, categories, budgets)
- Analysis, search, CSV, `.mbak` backup/restore
- Preferences: themes, passcode, web daily remind
- Ubuntu desktop install (`desktop:install-user`)
- Docs + open-source baseline (MIT)
- Versioning / changelog / release process

## Near term (candidates)

| Theme | Issue |
|-------|--------|
| Publish GitHub Release v1.0.0 | [#33](https://github.com/nandgatelabs/money-money/issues/33) |
| Attach AppImage / `.deb` to Releases | [#27](https://github.com/nandgatelabs/money-money/issues/27) |
| CSV export date range | [#19](https://github.com/nandgatelabs/money-money/issues/19) |
| Backup directory + restore list | [#20](https://github.com/nandgatelabs/money-money/issues/20) |
| Help / Feedback drawer | [#21](https://github.com/nandgatelabs/money-money/issues/21) |
| About privacy + license links | [#22](https://github.com/nandgatelabs/money-money/issues/22) |
| Native daily remind | [#23](https://github.com/nandgatelabs/money-money/issues/23) |

## Later

| Theme | Issue |
|-------|--------|
| Windows desktop shell | [#28](https://github.com/nandgatelabs/money-money/issues/28) |
| macOS desktop shell | [#29](https://github.com/nandgatelabs/money-money/issues/29) |
| Android Play Store / production AAB | [#30](https://github.com/nandgatelabs/money-money/issues/30) — preview APK via EAS already documented in [`DEVELOPMENT.md`](./DEVELOPMENT.md) |
| iOS EAS / store packaging (optional) | [#31](https://github.com/nandgatelabs/money-money/issues/31) |
| Public web hosting (COOP/COEP) | [#32](https://github.com/nandgatelabs/money-money/issues/32) |
| Web save-location picker | [#16](https://github.com/nandgatelabs/money-money/issues/16) |
| Older deferred bugs | [#12](https://github.com/nandgatelabs/money-money/issues/12), [#13](https://github.com/nandgatelabs/money-money/issues/13), [#15](https://github.com/nandgatelabs/money-money/issues/15) — only if explicitly revived |

## Non-goals (still)

- Cloud sync / accounts / multi-device merge
- Bank or SMS scraping
- Paywalls or premium tiers

## How this stays honest

- Changelog = what shipped ([`CHANGELOG.md`](../CHANGELOG.md))
- Roadmap = what’s next (this file)
- HLD §13 = delivery history + deferred issue table
- New work → feature branch → PR → release when we cut a version ([`RELEASE.md`](./RELEASE.md))
