import { useCanSplit } from "@/hooks/useViewportWidth";
import {
  useDesktopViewStore,
  type PaneId,
} from "@/store/desktopView";

export type EffectiveDesktopLayout =
  | { mode: "split"; left: PaneId; right: PaneId; activeSide: "left" | "right" }
  | { mode: "single"; pane: PaneId };

/**
 * Preferred layout, with split forced to single when the window is too narrow.
 * Split preference is kept in storage so widening restores it.
 */
export function useEffectiveDesktopLayout(): EffectiveDesktopLayout {
  const mode = useDesktopViewStore((s) => s.mode);
  const left = useDesktopViewStore((s) => s.left);
  const right = useDesktopViewStore((s) => s.right);
  const activeSide = useDesktopViewStore((s) => s.activeSide);
  const canSplit = useCanSplit();

  if (mode === "split" && canSplit) {
    return { mode: "split", left, right, activeSide };
  }
  return { mode: "single", pane: left };
}

/** @deprecated use useEffectiveDesktopLayout */
export function useEffectiveDesktopView(): string {
  const layout = useEffectiveDesktopLayout();
  if (layout.mode === "split") return "split";
  return layout.pane;
}
