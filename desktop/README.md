# money-money desktop (Electron)

Offline Ubuntu/desktop shell around the Expo **web** export.

- Serves `../dist` at **`http://127.0.0.1:47821`** with COOP/COEP
- Profile / DB: **`~/.config/money-money`**
- Packaged builds share that same profile with `npm run desktop:dev`

## One-time setup

From repo root:

```bash
npm install
npm run desktop:install
```

## Install into Ubuntu app grid (recommended)

```bash
npm run desktop:install-user
```

Copies `release/linux-unpacked` → `~/.local/share/money-money/` (no FUSE / AppImage required).

Update after pulling new code: run the same command again.

## Dev window

```bash
npm run desktop:dev
```

## Pack only

```bash
npm run desktop:pack
```

Outputs under `release/`: unpacked dir, `.AppImage`, and `.deb`.

Full docs: [`docs/DESKTOP.md`](../docs/DESKTOP.md).
