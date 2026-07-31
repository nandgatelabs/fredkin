# Releases

How to cut a **money-money** release (maintainer).

## Checklist

1. **Changelog** — Move items from `[Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md) into a new `## [X.Y.Z] — YYYY-MM-DD` section. Add compare links at the bottom.
2. **Version** — Bump with SemVer rules ([`VERSIONING.md`](./VERSIONING.md)):

   ```bash
   npm run version:set -- X.Y.Z
   ```

3. **Docs** — Update [`ROADMAP.md`](./ROADMAP.md) if a milestone shipped; touch HLD only if architecture changed.
4. **PR** — Branch `chore/release-X.Y.Z` → elaborate PR → maintainer test → squash-merge (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)).
5. **Tag + GitHub Release** — on updated `main`:

   ```bash
   git checkout main && git pull origin main
   git tag -a "vX.Y.Z" -m "vX.Y.Z"
   git push origin "vX.Y.Z"

   gh release create "vX.Y.Z" \
     --title "vX.Y.Z" \
     --notes-file <(awk '/^## \[X.Y.Z\]/{flag=1; next} /^## \[/{flag=0} flag' CHANGELOG.md)
   ```

   Or paste the matching CHANGELOG section into `gh release create` interactively.

6. **Desktop artifacts (optional for the GitHub Release)** — attach Ubuntu builds if you want downloadable binaries:

   ```bash
   npm run desktop:pack
   gh release upload "vX.Y.Z" \
     desktop/release/money-money-*.AppImage \
     desktop/release/money-money-desktop_*_amd64.deb
   ```

   Note: AppImage needs `libfuse2`/`libfuse2t64` on many Ubuntu hosts; prefer documenting `desktop:install-user` from source in release notes as well.

## First release (1.0.0)

After the versioning/changelog PR is on `main`, tag and publish:

```bash
git tag -a v1.0.0 -m "v1.0.0 — first public baseline"
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0" --notes-file CHANGELOG.md
```

(Prefer trimming notes to the `1.0.0` section only.)

## What not to do

- Do not retag or force-push published `v*` tags.
- Do not commit `private/`, `dist/`, or `desktop/release/`.
- Do not bump MAJOR without a migration note in CHANGELOG and HLD if data formats change.
