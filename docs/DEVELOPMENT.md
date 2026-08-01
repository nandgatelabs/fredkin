# Development — running the app

## Recommended: web (laptop)

Best path for day-to-day development and for trying the UI quickly:

```bash
git pull origin main
npm install
npm run web
```

Chrome or Edge should open (or go to `http://localhost:8081`). You should see the full-width dark shell with bottom tabs.

**Web keyboard tips:** in the add-record composer, type digits/`+ − * /`/Enter; Esc cancels. In editor modals, Esc cancels and Enter saves.

Web uses SQLite via WebAssembly (still alpha upstream). Prefer a normal Chrome/Edge window (not private/incognito).

**Only one browser tab** may hold the web DB (OPFS access-handle lock). A second tab usually fails with `NoModificationAllowedError` / `Invalid VFS state`.

If the DB fails to start:

1. Close every other `localhost:8081` tab (and old Expo windows)  
2. Hard-refresh the remaining tab  
3. If still stuck: DevTools → Application → Storage → **Clear site data** for `localhost:8081`, then refresh  
4. Confirm the branch under test: `git branch` (for P2 composer: `feature/p2-record-composer`)

On web, if persistent OPFS fails, the app falls back to an in-memory DB for that session (data resets on refresh, but UI is testable). A small `patch-package` fix lets that fallback work after an OPFS lock error.

## Desktop offline (Ubuntu)

Electron shell around the web export. Full guide: [`DESKTOP.md`](./DESKTOP.md).

```bash
npm run desktop:install        # once
npm run desktop:dev            # export + window window
npm run desktop:install-user   # install into app grid (~/.local)
```

## Android — installable APK (recommended)

No Android Studio required. Builds run in Expo’s cloud (**EAS**). Config lives in [`eas.json`](../eas.json) (`preview` → APK) and [`app.json`](../app.json) (`android.package`, `extra.eas.projectId`).

### One-time setup

1. Create / sign in at [expo.dev](https://expo.dev).
2. From the repo:

```bash
cd ~/dev/money-money
npx eas-cli@latest login
```

Project is already linked (`@shivamruts-team/money-money`). The Expo **slug** must stay `money-money` (same as `app.json`).

Do **not** need a global `npm install -g eas-cli` — `npx eas-cli@latest` is enough.

### Build a test APK

```bash
git pull origin main
npm install
npx eas-cli@latest build -p android --profile preview
```

- First run may ask to generate an Android keystore → choose **yes** (EAS stores it).
- Wait for the build on the Expo dashboard (~15–25 minutes is normal while Gradle runs).
- When status is **Finished**, download the `.apk`.

### Install on a phone

1. Copy the APK to the device (download link, USB, Drive, etc.).
2. Allow **Install unknown apps** for the browser/file manager if prompted.
3. Open the APK and install.
4. Launch **money-money**. Data stays on-device (SQLite).

After pulling new native-related or JS fixes, **rebuild** the preview APK — an old install will not pick up `main` until you install a new build.

### Profiles (see `eas.json`)

| Profile | Output | Use |
|---------|--------|-----|
| `preview` | **APK** | Sideload / device testing (this section) |
| `production` | **AAB** | Play Store / internal testing track |
| `development` | Dev client | Advanced; not needed for normal QA |

### Production AAB (Play Store path)

Preview APK packaging is done. For a store-shaped Android App Bundle:

```bash
npx eas-cli@latest build -p android --profile production
```

Then create a Play Console app with package `labs.nandgatelabs.moneymoney` and either upload the AAB manually or:

```bash
npx eas-cli@latest submit -p android --profile production
```

Verify on a device: offline SQLite, backup/export/share, daily remind permission. Store listing, screenshots, and privacy questionnaire are outside the repo.

### Troubleshooting

| Symptom | What to do |
|---------|------------|
| Slug mismatch (`shivamrut` vs `money-money`) | On expo.dev, use/create a project whose slug is **`money-money`**, matching `app.json`. |
| `eas` login / not logged in | `npx eas-cli@latest login` |
| Global `npm i -g eas-cli` hangs | Cancel; use `npx eas-cli@latest …` only |
| Tab bar under system buttons | Fixed on recent `main` — rebuild APK |
| Export “saved” but file missing | Fixed on recent `main` — rebuild; files go under a `money-money` folder + Share sheet |

## Android (Expo Go — optional)

For quick UI against Metro without a cloud build:

```bash
npm start
```

Scan the QR code with **Expo Go** (SDK must match this project — see [expo.dev/go](https://expo.dev/go)).

Expo Go is more fragile than a preview APK (SDK lag, Wi‑Fi drops). Prefer the APK path above for real device QA.

### Connection drops after splash (Expo Go)

1. Same Wi‑Fi as the laptop, VPN off  
2. USB debugging (below)  
3. Tunnel only if needed (`npx expo start --tunnel`)

### USB debugging (Expo Go)

1. Enable **Developer options** and **USB debugging**.  
2. Data-capable cable; USB **File transfer / MTP**.  
3. Accept **Allow USB debugging?** (`adb devices` → `device`).  
4. Then:

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

Open `exp://127.0.0.1:8081` in Expo Go, or press `a` in the Metro terminal.

## iOS packaging (optional, EAS)

Requires an **Apple Developer** account. Config stubs live in `app.json` (`ios.icon`); add a bundle identifier when you are ready to ship:

```json
"ios": {
  "bundleIdentifier": "labs.nandgatelabs.moneymoney",
  "icon": "./assets/expo.icon"
}
```

```bash
npx eas-cli@latest build -p ios --profile preview
# or production → TestFlight / App Store via eas submit
```

Prerequisites: Apple team membership, provisioning via EAS credentials prompts, macOS not required for cloud builds. On device, confirm offline SQLite, Share-based export/backup, and notification permission for daily remind. Custom save folders are limited on iOS (app Documents / `money-money`).

## Web hosting (COOP/COEP static deploy)

The web app needs isolation headers so `expo-sqlite` / OPFS works:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

These are already set for Expo web / static export in `app.json` (expo-router headers) and for Electron in `desktop/main.cjs`. A public host must send the same headers on HTML and assets.

### Recipe

```bash
npm run web:export
# serve the contents of dist/ behind a reverse proxy that adds COOP/COEP
```

Example **nginx** snippet:

```nginx
add_header Cross-Origin-Opener-Policy same-origin always;
add_header Cross-Origin-Embedder-Policy credentialless always;

location / {
  try_files $uri $uri.html $uri/ /index.html;
}
```

Example **Netlify** `_headers` in `dist/` (or publish directory):

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: credentialless
```

### Limitations

- **One tab** holds the OPFS lock — a second tab usually fails to open the DB
- Prefer a normal browser window (not private/incognito)
- Deep links need SPA fallbacks (`try_files` / platform redirects) for routes like `/account/[id]`
- Save location: Chrome/Edge can use folder / Save As pickers; Firefox falls back to Downloads (see Export/Backup screens)

Public hosting is optional — desktop Electron and EAS Android remain the offline install paths.

## What “working” looks like (P0+)

- Dark charcoal UI, **Fredkin** header (Fredkin by NandGateLabs)  
- Tabs: Events, Insights, Wallets, Event Type (Budgets hidden from nav)  
- Events empty state until data exists; **+** opens the add-event composer

## Agents / PR merges

Open a PR for review. **Do not merge until a maintainer has tested usability and explicitly says to merge.** See [`CONTRIBUTING.md`](../CONTRIBUTING.md).
