# Roadmap

Living plan after **v1.0.0**. Priorities change when a maintainer schedules work; open issues are not automatic commitments.

## Shipped — v1.0.0

- Offline ledger (records, accounts, categories, budgets)
- Analysis, search, CSV, `.mbak` backup/restore
- Preferences: themes, passcode, web daily remind
- Ubuntu desktop install (`desktop:install-user`)
- Docs + open-source baseline (MIT)

## Near term (candidates)

Pull from deferred issues when scheduled:

| Theme | Issues / notes |
|-------|----------------|
| Export polish | [#19](https://github.com/nandgatelabs/money-money/issues/19) CSV date range |
| Backup UX | [#20](https://github.com/nandgatelabs/money-money/issues/20) backup directory + restore list |
| Help / About | [#21](https://github.com/nandgatelabs/money-money/issues/21), [#22](https://github.com/nandgatelabs/money-money/issues/22) |
| Native remind | [#23](https://github.com/nandgatelabs/money-money/issues/23) |
| Desktop distribution | Attach AppImage/`.deb` to GitHub Releases; Windows/macOS shells later |

## Later

- Android (and optional iOS) store / EAS packaging
- Public **web hosting** (parked; needs COOP/COEP + save-folder story — [#16](https://github.com/nandgatelabs/money-money/issues/16))
- Older deferred bugs (#12–#15) only if explicitly revived

## Non-goals (still)

- Cloud sync / accounts / multi-device merge
- Bank or SMS scraping
- Paywalls or premium tiers

## How this stays honest

- Changelog = what shipped ([`CHANGELOG.md`](../CHANGELOG.md))
- Roadmap = what’s next (this file)
- HLD §13 = delivery history + deferred issue table
- New work → feature branch → PR → release when we cut a version ([`RELEASE.md`](./RELEASE.md))
