# Agent instructions

This repo is **money-money**: an offline-first personal finance app.

## Read first (source of truth)

| Doc | Path | Use when |
|-----|------|----------|
| High-level design | [`docs/HLD.md`](docs/HLD.md) | Architecture, modules, data rules, phases |
| Feature blueprint | [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) | Screen-by-screen UI/behavior, acceptance checklist |

Do **not** invent paywalls, premium locks, or cloud sync unless a human explicitly asks.

## Hard product rules

1. **Fully offline** — no required network at runtime.
2. **No paywall** — all view modes (including 3/6/yearly), themes, passcode, and full icon set are unlocked.
3. **Stack** — Expo + React Native + TypeScript + expo-sqlite + expo-router + Zustand.
4. **Personal data** — directory `private/` is gitignored. Never commit it.
5. **Backup format** — `.mbak` is versioned JSON. CSV is for worksheet export/import only.

## Implementation order

Follow phases in `docs/HLD.md` § Delivery plan (P0 → P6). Prefer small vertical slices over large unfinished surfaces.

## GitHub workflow (required)

Canonical repo: [nandgatelabs/money-money](https://github.com/nandgatelabs/money-money) (org: **nandgatelabs**).

Full detail: [`CONTRIBUTING.md`](CONTRIBUTING.md).

1. **Never commit straight to `main`** for normal work.
2. Create a branch: `feature/…`, `fix/…`, `docs/…`, or `chore/…`.
3. Make focused commits; **subject must start with an intent prefix** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `perf:`, `style:`). See [`CONTRIBUTING.md`](CONTRIBUTING.md).
4. Open an **elaborate PR** with `gh pr create` (Summary + Test plan + Notes); prefer a prefixed title too.
5. Merge with `gh pr merge` (prefer `--squash`), then sync local `main`.
6. If product/architecture behavior changes, update `docs/HLD.md` and/or `docs/BLUEPRINT.md` in the **same PR**.

## Open source hygiene

- Keep secrets and real user ledgers out of git (`private/`, `.env*`).
- Prefer documented behavior in `docs/` over chat-only decisions; update those docs when product rules change.
- License is MIT — preserve the `LICENSE` file and copyright notice in distributions.
- Security reports go to email per [`SECURITY.md`](SECURITY.md) — never invent public “security issue” filings with exploit detail.
- Community interactions follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
