import { useCanSplit } from "@/hooks/useViewportWidth";
import { useDesktopViewStore, type DesktopView } from "@/store/desktopView";

/**
 * Preferred view, with split forced down to Events when the window is too narrow.
 * Preference stays `split` in storage so widening the window restores it.
 */
export function useEffectiveDesktopView(): DesktopView {
  const view = useDesktopViewStore((s) => s.view);
  const canSplit = useCanSplit();
  if (view === "split" && !canSplit) return "events";
  return view;
}
