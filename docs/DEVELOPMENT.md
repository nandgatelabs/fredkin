# Development — running the app

## Recommended: web (laptop)

Best path for day-to-day development and for trying the UI quickly:

```bash
git pull origin main
npm install
npm run web
```

Chrome or Edge should open (or go to `http://localhost:8081`). On desktop, the UI is framed in a centered phone preview (not stretched full-width). You should see the dark shell with bottom tabs.

Web uses SQLite via WebAssembly (still alpha upstream). Prefer a normal Chrome/Edge window (not private/incognito).

**Only one browser tab** may hold the web DB (OPFS access-handle lock). A second tab usually fails with `NoModificationAllowedError` / `Invalid VFS state`.

If the DB fails to start:

1. Close every other `localhost:8081` tab (and old Expo windows)  
2. Hard-refresh the remaining tab  
3. If still stuck: DevTools → Application → Storage → **Clear site data** for `localhost:8081`, then refresh  
4. Confirm the branch under test: `git branch` (for P2 composer: `feature/p2-record-composer`)

On web, if persistent OPFS fails, the app falls back to an in-memory DB for that session (data resets on refresh, but UI is testable). A small `patch-package` fix lets that fallback work after an OPFS lock error.

## Android (Expo Go)

Physical phones work, but the toolchain is more fragile than web.

```bash
npm start
```

Scan the QR code with **Expo Go**.

### SDK mismatch

This project targets a recent Expo SDK. The Expo Go build on app stores may lag.

- Prefer Expo Go matching this project’s SDK from [expo.dev/go](https://expo.dev/go) when the store build reports incompatibility.
- “Latest from the store” is not always new enough.

### Connection drops after splash

If the splash/logo appears and then the session dies, the phone often lost Metro over Wi‑Fi (VPN, guest Wi‑Fi isolation, firewall).

Try:

1. Same Wi‑Fi as the laptop, VPN off  
2. USB debugging (below)  
3. Tunnel only if needed (`npx expo start --tunnel`) — tunnels depend on a third-party relay and can fail with “session closed”

### USB debugging

More stable than LAN when it works:

1. Enable **Developer options** and **USB debugging** (not only developer mode).  
2. Use a data-capable cable; set USB mode to **File transfer / MTP**.  
3. Accept **Allow USB debugging?** on the phone (`adb devices` must show `device`, not `unauthorized`).  
4. Then:

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

Open `exp://127.0.0.1:8081` in Expo Go, or press `a` in the Metro terminal.

## What “working” looks like (P0+)

- Dark charcoal UI, **money-money** header  
- Tabs: Records, Analysis, Budgets, Accounts, Categories  
- Records empty state until data exists; **+** opens the add-record composer

## Agents / PR merges

Open a PR for review. **Do not merge until a maintainer has tested usability and explicitly says to merge.** See [`CONTRIBUTING.md`](../CONTRIBUTING.md).
