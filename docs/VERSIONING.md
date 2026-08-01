# Versioning

**Fredkin** uses [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`.

## What the numbers mean

| Bump | When |
|------|------|
| **MAJOR** | Breaking change for users or data (e.g. incompatible `.mbak` / DB migration that needs a one-way upgrade path, removed features) |
| **MINOR** | New capability backward-compatible (new screen, export option, desktop platform) |
| **PATCH** | Bug fix, docs-only release tags, packaging tweaks with no feature change |

Pre-1.0 used `0.1.0` during build-out. **1.0.0** is the first supported baseline (P0–P8 + Ubuntu desktop).

## Single source of truth

Root [`package.json`](../package.json) `version` is canonical. Keep these in sync (use the script):

| File | Field |
|------|--------|
| `package.json` | `version` |
| `app.json` | `expo.version` |
| `desktop/package.json` | `version` |

```bash
npm run version:sync          # re-read root and write others
npm run version:set -- 1.1.0  # set root + sync
```

## Git tags

Release tags are `v` + semver, e.g. `v1.0.0`. Tag **annotated** tags on `main` after the release PR merges. Details: [`RELEASE.md`](./RELEASE.md).
