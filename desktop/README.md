# Fredkin desktop (Electron)

Offline desktop shell around the Expo **web** export (Linux, Windows, macOS).

- Serves `../dist` at **`http://127.0.0.1:47821`** with COOP/COEP
- Profile / DB under Electron `userData` → app folder **`Fredkin`**
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

Copies `release/linux-unpacked` → `~/.local/share/fredkin/` (no FUSE / AppImage required).

Update after pulling new code: run the same command again.

## Dev window

```bash
npm run desktop:dev
```

## Pack

```bash
npm run desktop:pack:linux   # AppImage + .deb
npm run desktop:pack:win     # NSIS + portable (build on Windows)
npm run desktop:pack:mac     # dmg + zip (build on macOS)
```

Outputs under `release/`.

Full docs: [`docs/DESKTOP.md`](../docs/DESKTOP.md).
