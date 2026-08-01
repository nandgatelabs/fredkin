# Desktop offline (Electron)

Parked for later: public web hosting (see [`DEVELOPMENT.md`](./DEVELOPMENT.md) § Web hosting). For a **local offline desktop app**, we wrap the Expo **web** static export in Electron (Chromium) and serve it on a **fixed** loopback origin with COOP/COEP so `expo-sqlite` / OPFS works and **data persists**.

Source lives in [`desktop/`](../desktop/) (tracked in git). Build artifacts (`dist/`, `desktop/release/`, `desktop/node_modules/`) are gitignored.

`desktop/main.cjs` is shared across Linux, Windows, and macOS — same loopback server and profile rules.

## Persistence

SQLite on web lives in Chromium OPFS, keyed by **origin** (`http://host:port`) and Electron **userData**.

| Setting | Value |
|---------|--------|
| Origin | `http://127.0.0.1:47821` (override with `DESKTOP_PORT`) |
| Profile (Linux) | `~/.config/Fredkin` |
| Profile (Windows) | `%APPDATA%\Fredkin` |
| Profile (macOS) | `~/Library/Application Support/Fredkin` |

Older installs may still have data under `money-money` profile folders. `desktop/main.cjs` reuses that legacy profile automatically when a `Fredkin` profile does not exist yet.

`desktop:dev` and the installed app share that profile — close and reopen keeps your ledger.

## Ubuntu install (recommended)

From a clone of this repo:

```bash
npm install
npm run desktop:install        # once — deps under desktop/
npm run desktop:install-user   # export web + pack + install for current user
```

What that does:

1. Exports the web app to `dist/`
2. Builds Electron under `desktop/release/linux-unpacked/`
3. Copies the unpacked app to `~/.local/share/fredkin/`
4. Writes `~/.local/share/applications/fredkin.desktop`
5. Adds a `fredkin` wrapper on your `PATH` (`~/.local/bin`)

Open **Fredkin** from the Ubuntu app grid, or:

```bash
fredkin
```

We install the **unpacked** binary (not the AppImage). AppImages need `libfuse2` / `libfuse2t64`, which many Ubuntu systems lack — the icon would show but fail to open.

### Update an existing install

```bash
git pull origin main
npm install
npm run desktop:install-user
```

Your ledger in `~/.config/Fredkin` is left alone.

### Uninstall (user install)

```bash
rm -rf ~/.local/share/fredkin
rm -f ~/.local/share/applications/fredkin.desktop
rm -f ~/.local/bin/fredkin
# optional: wipe local DB/profile
# rm -rf ~/.config/Fredkin
```

## Other Linux install options

### System `.deb` (sudo)

```bash
npm run desktop:pack:linux
sudo apt install ./desktop/release/fredkin*_amd64.deb
```

### AppImage (needs FUSE)

```bash
npm run desktop:pack:linux
sudo apt install libfuse2t64   # Ubuntu 24.04+; older: libfuse2
chmod +x desktop/release/Fredkin-*.AppImage
./desktop/release/Fredkin-*.AppImage
```

## Windows

Build on a Windows host (or CI with Windows runners). Cross-compiling NSIS from Linux often needs Wine; prefer a native Windows machine for signed installs.

```bash
npm install
npm run desktop:install
npm run desktop:pack:win
```

Artifacts under `desktop/release/`:

- **NSIS installer** — guided install + Start Menu / desktop shortcut
- **Portable** — single `.exe`, no install step

Profile: `%APPDATA%\Fredkin` (survives reinstall). Code signing is optional for local use; Windows SmartScreen may warn on unsigned downloads.

## macOS

Build on a Mac (Apple Silicon or Intel).

```bash
npm install
npm run desktop:install
npm run desktop:pack:mac
```

Artifacts: `.dmg` and `.zip` for `x64` and `arm64`.

Profile: `~/Library/Application Support/Fredkin`.

**Signing / notarization:** local personal use can run unsigned builds (you may need right-click → Open the first time). Distributing outside your machine typically needs an Apple Developer ID + notarization — not configured in this repo by default (`hardenedRuntime` / Gatekeeper assess left off for local packs).

## Dev window (no install)

```bash
npm run desktop:install   # once
npm run desktop:dev       # export + Electron window
```

DevTools: `DESKTOP_DEV=1 npm run desktop:dev`  
Broken GPU: `DESKTOP_NO_GPU=1 npm run desktop:dev`

## Scripts (repo root)

| Script | What it does |
|--------|----------------|
| `npm run web:export` | Expo static export → `dist/` |
| `npm run desktop:install` | Install Electron deps in `desktop/` |
| `npm run desktop:dev` | Export + open Electron window |
| `npm run desktop:pack` | Export + Linux AppImage + `.deb` |
| `npm run desktop:pack:linux` | Same as `desktop:pack` |
| `npm run desktop:pack:win` | Export + Windows NSIS + portable |
| `npm run desktop:pack:mac` | Export + macOS `.dmg` + `.zip` |
| `npm run desktop:install-user` | Pack Linux + install launcher for current user |

More detail: [`desktop/README.md`](../desktop/README.md).
