# Platform shells

Shared product core (`db/`, `lib/`, stores, themes) stays platform-agnostic.

UI chrome diverges via Metro platform extensions:

| File | Native | Web |
|------|--------|-----|
| `ShellFrame` | Full bleed | Full-bleed viewport |
| `AppHeader` | Fredkin · search · menu | Fredkin · optically centered search · period · display · panes · + · Split · ? · More |
| `ShellTabBar` / tabs `_layout` | Events · `+` · Insights | Hidden — nav is in the header |
| Home (`index`) | Events tab | `DesktopShell` (single or split) |
| Search | Full-screen route | Centered dialog (`SearchModal`) |
| More | Edge drawer + header menu + edge swipe-in | Stack `/more` dialog, App only |
| Dialog chrome | Chevron Back · icon Close; Back from More-stack reopens drawer | Text ← BACK / ✕ CLOSE |
| Event rows | Swipe right Edit · left Delete | Tap → detail (no swipe) |

**Native More**

- Plain right-edge pill (no icon); header menu button; swipe left from the right edge.
- Panel edge-flush (top/right/bottom); rounded leading edge only.
- Navigating to Settings/Data/… slides the drawer away; **Back** returns with the drawer open again. **Close** returns to the shell without reopening More.

**Web layout** (`store/desktopView.ts`):

- Panes: `events` · `insights` · `wallets` · `categories` · `people`
- Modes: `single` | `split` (any left|right pair)
- Preference persisted in `localStorage` (`fredkin.desktopShell`)
- Below `layout.splitMinWidth` (900px), split falls back to single
- In split: header period chip; each column has picker + maximize; details stay in-pane
- Keyboard help: header `?` or `?` key

Shared panes: `EventsPane`, `InsightsPane`, `WalletsPane`, `CategoriesPane`, `PeoplePane`.

Prefer `.web.tsx` / default native files for structural differences.
Use `Platform.OS` only for tiny style tweaks.
