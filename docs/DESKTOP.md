# Desktop offline (Ubuntu / Electron)

Parked for later: public web hosting. For a **local offline desktop app**, we wrap the Expo **web** static export in Electron (Chromium) and serve it on a **fixed** loopback origin with COOP/COEP so `expo-sqlite` / OPFS works and **data persists**.

Source lives in [`desktop/`](../desktop/) (tracked in git). Build artifacts (`dist/`, `desktop/release/`, `desktop/node_modules/`) are gitignored.

## Persistence

SQLite on web lives in Chromium OPFS, keyed by **origin** (`http://host:port`) and Electron **userData**.

| Setting | Value |
|---------|--------|
| Origin | `http://127.0.0.1:47821` (override with `DESKTOP_PORT`) |
| Profile | `~/.config/money-money` |

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
3. Copies the unpacked app to `~/.local/share/money-money/`
4. Writes `~/.local/share/applications/money-money.desktop`
5. Adds a `money-money` wrapper on your `PATH` (`~/.local/bin`)

Open **money-money** from the Ubuntu app grid, or:

```bash
money-money
```

We install the **unpacked** binary (not the AppImage). AppImages need `libfuse2` / `libfuse2t64`, which many Ubuntu systems lack — the icon would show but fail to open.

### Update an existing install

```bash
git pull origin main
npm install
npm run desktop:install-user
```

Your ledger in `~/.config/money-money` is left alone.

### Uninstall (user install)

```bash
rm -rf ~/.local/share/money-money
rm -f ~/.local/share/applications/money-money.desktop
rm -f ~/.local/bin/money-money
# optional: wipe local DB/profile
# rm -rf ~/.config/money-money
```

## Other install options

### System `.deb` (sudo)

```bash
npm run desktop:pack
sudo apt install ./desktop/release/money-money-desktop_*_amd64.deb
```

### AppImage (needs FUSE)

```bash
npm run desktop:pack
sudo apt install libfuse2t64   # Ubuntu 24.04+; older: libfuse2
chmod +x desktop/release/money-money-*.AppImage
./desktop/release/money-money-*.AppImage
```

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
| `npm run desktop:pack` | Export + AppImage + `.deb` in `desktop/release/` |
| `npm run desktop:install-user` | Pack + install launcher for current user |

More detail: [`desktop/README.md`](../desktop/README.md).
