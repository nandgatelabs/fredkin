# Roadmap

Living plan after **v1.0.0**. Priorities change when a maintainer schedules work; open issues are not automatic commitments.

## Shipped — v1.0.0

- Offline ledger (records, accounts, categories, budgets)
- Analysis, search, CSV, `.mbak` backup/restore
- Preferences: themes, passcode, web daily remind
- Ubuntu desktop install (`desktop:install-user`)
- Docs + open-source baseline (MIT)
- Versioning / changelog / release process

## Shipped in polish (post-1.0.0 commits; close issues after merge)

| Theme | Issue |
|-------|--------|
| Flow chart hit-test + multi-month calendar | [#12](https://github.com/nandgatelabs/fredkin/issues/12), [#13](https://github.com/nandgatelabs/fredkin/issues/13) |
| Decimal places clamp / formatting | [#15](https://github.com/nandgatelabs/fredkin/issues/15) |
| Web Save As + folder picker | [#16](https://github.com/nandgatelabs/fredkin/issues/16) |
| CSV export date range | [#19](https://github.com/nandgatelabs/fredkin/issues/19) |
| Backup directory + restore list | [#20](https://github.com/nandgatelabs/fredkin/issues/20) |
| Help / Feedback drawer | [#21](https://github.com/nandgatelabs/fredkin/issues/21) |
| About privacy + license | [#22](https://github.com/nandgatelabs/fredkin/issues/22) |
| Native daily remind | [#23](https://github.com/nandgatelabs/fredkin/issues/23) |
| Windows / macOS Electron pack targets | [#28](https://github.com/nandgatelabs/fredkin/issues/28), [#29](https://github.com/nandgatelabs/fredkin/issues/29) |
| Android preview APK + production AAB docs | [#30](https://github.com/nandgatelabs/fredkin/issues/30) |
| iOS EAS recipe (optional) | [#31](https://github.com/nandgatelabs/fredkin/issues/31) |
| Web hosting COOP/COEP recipe | [#32](https://github.com/nandgatelabs/fredkin/issues/32) |
| Release process + artifact upload docs | [#27](https://github.com/nandgatelabs/fredkin/issues/27), [#33](https://github.com/nandgatelabs/fredkin/issues/33) — tag/release runs on `main` after merge |

## Near term (maintainer actions on `main`)

| Theme | Notes |
|-------|--------|
| Publish GitHub Release v1.0.0 | Follow [`RELEASE.md`](./RELEASE.md); attach Linux artifacts |
| Play Store AAB submit | Optional; needs Play Console |

## Ledger backlog

Detailed specs: [`docs/pending/README.md`](./pending/README.md).

| Theme | Notes |
|-------|--------|
| Sticky event date | Shipped — composer remembers last new-event date |
| Wallet check + adjustment | Shipped — real vs app balance; absorb without fake spend/income |
| Occasions | Pending — group related events (e.g. outing) |
| People | Shipped — person on events; IOU roles; wallet → person; web People pane |

## Later / out of band

| Theme | Notes |
|-------|--------|
| Signed / notarized desktop binaries | Apple Developer ID, Windows codesign |
| Public hosted web URL | Ops: deploy `dist/` with COOP/COEP |
| iOS App Store listing | Optional; Apple team required |

## Non-goals (still)

- Cloud sync / accounts / multi-device merge
- Bank or SMS scraping
- Paywalls or premium tiers

## How this stays honest

- Changelog = what shipped ([`CHANGELOG.md`](../CHANGELOG.md))
- Roadmap = what’s next (this file)
- Ledger ideas = [`docs/pending/README.md`](./pending/README.md)
- HLD §13 = delivery history + deferred issue table
- New work → feature branch → PR → release when we cut a version ([`RELEASE.md`](./RELEASE.md))
