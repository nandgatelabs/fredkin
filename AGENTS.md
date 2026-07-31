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

## Open source hygiene

- Keep secrets and real user ledgers out of git (`private/`, `.env*`).
- Prefer documented behavior in `docs/` over chat-only decisions; update those docs when product rules change.
- License is MIT — preserve the `LICENSE` file and copyright notice in distributions.
