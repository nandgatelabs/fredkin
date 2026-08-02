# Platform shells

Shared product core (`db/`, `lib/`, stores, themes) stays platform-agnostic.

UI chrome diverges via Metro platform extensions:

| File | Native | Web |
|------|--------|-----|
| `ShellFrame` | Full bleed | Full-bleed viewport |
| `AppHeader` | Fredkin · search | Fredkin · search · **Events · + · Insights** · Split · More |
| `ShellTabBar` | Events · `+` · Insights | Hidden (`null`) — nav is in the header |
| Home (`index`) | Events tab | **Split** (default) or full Events |
| Insights (`analysis`) | Insights tab | Full Insights |
| `MoreEdge` | Right-edge tab | No-op (More is in the header) |
| `MorePaneHost` | Shared drawer host (both) | Shared drawer host (both) |

**Web layout modes** (`store/desktopView.ts`): `split` (default) · `events` · `insights`

- Preference persisted in `localStorage` (`fredkin.desktopView`)
- Below `layout.splitMinWidth` (900px), split falls back to full Events (preference kept)
- Header **Events** / **Insights** → that pane full-screen  
- Header **Split** → side-by-side (hidden when too narrow)  
- Activate the current full-screen nav item again → back to split (when wide enough)  


Shared panes: `EventsPane`, `InsightsPane`. Full screens: `EventsHome`, `InsightsHome`.

Prefer `.web.tsx` / default native files for structural differences.
Use `Platform.OS` only for tiny style tweaks.
