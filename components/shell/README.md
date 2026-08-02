# Platform shells

Shared product core (`db/`, `lib/`, stores, themes) stays platform-agnostic.

UI chrome diverges via Metro platform extensions:

| File | Native | Web |
|------|--------|-----|
| `ShellFrame` | Full bleed | Full-bleed viewport |
| `AppHeader` | Fredkin · search | Fredkin · optically centered search · period · display · panes · + · Split · ? · More |
| `ShellTabBar` / tabs `_layout` | Events · `+` · Insights | Hidden — nav is in the header |
| Home (`index`) | Events tab | `DesktopShell` (single or split) |
| Search | Full-screen route | Centered ~50% modal (`SearchModal`) |
| More | Edge drawer (Manage + App) | Centered ~50% modal, App only |

**Web layout** (`store/desktopView.ts`):

- Panes: `events` · `insights` · `wallets` · `categories`
- Modes: `single` | `split` (any left|right pair)
- Preference persisted in `localStorage` (`fredkin.desktopShell`)
- Below `layout.splitMinWidth` (900px), split falls back to single
- In split: header period chip; each column has picker + maximize; details stay in-pane
- Keyboard help: header `?` or `?` key

Shared panes: `EventsPane`, `InsightsPane`, `WalletsPane`, `CategoriesPane`.

Prefer `.web.tsx` / default native files for structural differences.
Use `Platform.OS` only for tiny style tweaks.
