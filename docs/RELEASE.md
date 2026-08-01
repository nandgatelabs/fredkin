# Releases

How to cut a **Fredkin** release (maintainer).

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

   node scripts/extract-changelog.mjs X.Y.Z > /tmp/mm-notes.md
   gh release create "vX.Y.Z" \
     --title "vX.Y.Z" \
     --notes-file /tmp/mm-notes.md
   ```

6. **Desktop artifacts (recommended for public downloads)** — attach platform builds when available:

   ```bash
   # Linux (this machine / Ubuntu CI)
   npm run desktop:pack:linux
   gh release upload "vX.Y.Z" \
     desktop/release/Fredkin-*.AppImage \
     desktop/release/fredkin*_amd64.deb

   # Windows (build on Windows host)
   npm run desktop:pack:win
   gh release upload "vX.Y.Z" desktop/release/Fredkin-*-win-*.*

   # macOS (build on a Mac)
   npm run desktop:pack:mac
   gh release upload "vX.Y.Z" desktop/release/Fredkin-*-mac-*.*
   ```

   Release notes should mention:

   - **Ubuntu preferred path:** `npm run desktop:install-user` from source (no FUSE)
   - AppImage needs `libfuse2` / `libfuse2t64` on many Ubuntu hosts
   - Windows/macOS signing is optional for local use; SmartScreen / Gatekeeper may warn on unsigned builds

## First release (1.0.0)

Version files are already at **1.0.0**. After polish PRs are on `main`:

```bash
git checkout main && git pull origin main
git tag -a v1.0.0 -m "v1.0.0 — first public baseline"
git push origin v1.0.0

node scripts/extract-changelog.mjs 1.0.0 > /tmp/mm-notes.md
gh release create v1.0.0 --title "v1.0.0" --notes-file /tmp/mm-notes.md

npm run desktop:pack:linux
gh release upload v1.0.0 \
  desktop/release/Fredkin-*.AppImage \
  desktop/release/fredkin*_amd64.deb
```

Do **not** create the tag/release from a feature branch — only from merged `main`.

## Android store build (optional companion)

Preview APKs are documented in [`DEVELOPMENT.md`](./DEVELOPMENT.md). For a Play-bound AAB after a tagged release:

```bash
npx eas-cli@latest build -p android --profile production
```

Submit is separate (`eas submit`) and needs a Play Console listing.

## What not to do

- Do not retag or force-push published `v*` tags.
- Do not commit `private/`, `dist/`, or `desktop/release/`.
- Do not bump MAJOR without a migration note in CHANGELOG and HLD if data formats change.
