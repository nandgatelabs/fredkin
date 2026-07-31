# money-money

Offline-first personal finance app. Local SQLite storage, CSV export, and JSON backups — no account, no cloud, no paywall.

> **v1.0.0** baseline shipped. Prefer **web** for day-to-day runs; Ubuntu desktop install below. See [`CHANGELOG.md`](CHANGELOG.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Quick start (web — recommended)

```bash
npm install
npm run web
```

Opens in Chrome/Edge at `http://localhost:8081`. Full runbook (Android caveats, USB, Expo Go SDK mismatch): [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Ubuntu desktop (offline install)

Install **money-money** into your app grid (no sudo). Data persists in `~/.config/money-money`.

```bash
npm install
npm run desktop:install        # once — Electron tooling
npm run desktop:install-user   # pack + install launcher
```

Then open **money-money** from the app grid, or run `money-money` in a terminal.

**Update later** (after `git pull`):

```bash
npm install
npm run desktop:install-user
```

Full detail (`.deb`, AppImage/FUSE notes, persistence): [`docs/DESKTOP.md`](docs/DESKTOP.md).

## Docs

| Doc | Description |
|-----|-------------|
| [`docs/HLD.md`](docs/HLD.md) | High-level design: architecture, data model, flows, phases |
| [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) | Screen-by-screen feature / UI blueprint |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | How to run on web and Android |
| [`docs/DESKTOP.md`](docs/DESKTOP.md) | Offline Ubuntu/desktop Electron shell |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | What’s next after v1 |
| [`docs/VERSIONING.md`](docs/VERSIONING.md) | SemVer rules |
| [`docs/RELEASE.md`](docs/RELEASE.md) | How to cut a release |
| [`CHANGELOG.md`](CHANGELOG.md) | Notable changes per version |
| [`AGENTS.md`](AGENTS.md) | Instructions for AI coding agents |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branch → PR → merge workflow (`gh`) |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Community standards |

Repo: [nandgatelabs/money-money](https://github.com/nandgatelabs/money-money)

## Development

Use feature branches and GitHub PRs — do not push ordinary work straight to `main`. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

By participating, you agree to the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Stack

Expo · React Native · TypeScript · expo-router · expo-sqlite · Zustand

## Privacy

Do not commit real ledgers, backups, or personal screenshots. Keep those under the gitignored `private/` folder.

## Security

Report vulnerabilities privately — see [`SECURITY.md`](SECURITY.md). Do not open public issues for security reports.

## License

[MIT](LICENSE) — Copyright © 2026 Shivamrut (`gshivamrut@gmail.com`)
