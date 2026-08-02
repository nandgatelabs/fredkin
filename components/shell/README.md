# Platform shells

Shared product core (`db/`, `lib/`, stores, themes) stays platform-agnostic.

UI chrome diverges via Metro platform extensions:

| File | Native | Web |
|------|--------|-----|
| `ShellFrame` | Full bleed | Full-bleed viewport |
| `AppHeader` | Fredkin · search | Fredkin · search · **Split** · **More** |
| `ShellTabBar` | Events · `+` · Insights | Same chrome; selection follows desktop view |
| Home (`index`) | Events tab | **Split** (default) or full Events |
| Insights (`analysis`) | Insights tab | Full Insights |
| `MoreEdge` | Right-edge tab | No-op (More is in the header) |
| `MorePaneHost` | Shared drawer host (both) | Shared drawer host (both) |

**Web layout modes** (`store/desktopView.ts`): `split` (default) · `events` · `insights`

- Header **Split** → side-by-side Events | Insights  
- Bottom **Events** / **Insights** → that pane full-screen  
- Tap the active full-screen tab again → back to split  

Shared panes: `EventsPane`, `InsightsPane`. Full screens: `EventsHome`, `InsightsHome`.

Prefer `.web.tsx` / default native files for structural differences.
Use `Platform.OS` only for tiny style tweaks.
