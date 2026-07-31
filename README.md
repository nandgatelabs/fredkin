# money-money

Offline-first personal finance app (Android-first). Local SQLite storage, CSV export, and JSON backups — no account, no cloud, no paywall.

> Status: **P0 shell running** — tabs, theme, SQLite schema, settings store. Feature slices continue per [`docs/HLD.md`](docs/HLD.md).

## Quick start (laptop browser)

Easiest way to try the app while phone Expo Go is flaky:

```bash
npm install
npm run web
```

Chrome/Edge should open at `http://localhost:8081`. You should see the dark **Records** screen with tabs and a **+** button.

## Phone / emulator

```bash
npm start
```

Then press `a` (Android) or scan the QR in **Expo Go for SDK 57** from [expo.dev/go](https://expo.dev/go) (Play Store build may lag).

USB (more stable than Wi‑Fi):

```bash
adb devices          # must say "device", not unauthorized
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

## Docs

| Doc | Description |
|-----|-------------|
| [`docs/HLD.md`](docs/HLD.md) | High-level design: architecture, data model, flows, phases |
| [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) | Screen-by-screen feature / UI blueprint |
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
