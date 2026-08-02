import { useCallback } from "react";
import { usePathname, useRouter } from "expo-router";

import { useCanSplit } from "@/hooks/useViewportWidth";
import { useKeydown } from "@/hooks/useKeydown";
import { useDesktopViewStore, type PaneId } from "@/store/desktopView";
import { usePeriodStore } from "@/store/period";
import { useShortcutsHelpStore } from "@/store/shortcutsHelp";

const PANE_BY_DIGIT: Record<number, PaneId> = {
  1: "events",
  2: "insights",
  3: "wallets",
  4: "categories",
};

function shiftMonthIso(iso: string, delta: number) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

function isEditorRoute(pathname: string) {
  return (
    pathname.startsWith("/record") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/export") ||
    pathname.startsWith("/backup") ||
    pathname.startsWith("/reset") ||
    pathname.startsWith("/preferences")
  );
}

/**
 * Laptop keyboard shortcuts (web only via useKeydown).
 * ⌘/Ctrl+K or / search · ? help · n new · s split · ← → period · 1–4 panes
 */
export function WebAppShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const setAnchorDate = usePeriodStore((s) => s.setAnchorDate);
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const mode = useDesktopViewStore((s) => s.mode);
  const openPane = useDesktopViewStore((s) => s.openPane);
  const enterSplit = useDesktopViewStore((s) => s.enterSplit);
  const setMode = useDesktopViewStore((s) => s.setMode);
  const canSplit = useCanSplit();
  const openHelp = useShortcutsHelpStore((s) => s.openHelp);

  useKeydown(
    true,
    useCallback(
      (event) => {
        const mod = event.metaKey || event.ctrlKey;

        if (mod && (event.key === "k" || event.key === "K")) {
          event.preventDefault();
          router.push("/search");
          return;
        }

        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (isEditorRoute(pathname)) return;

        if (event.key === "/") {
          event.preventDefault();
          router.push("/search");
          return;
        }

        if (event.key === "?") {
          event.preventDefault();
          openHelp();
          return;
        }

        if (event.key === "n" || event.key === "N") {
          event.preventDefault();
          router.push("/record/new");
          return;
        }

        if ((event.key === "s" || event.key === "S") && canSplit) {
          event.preventDefault();
          if (mode === "split") setMode("single");
          else enterSplit();
          router.navigate("/");
          return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          const delta = event.key === "ArrowLeft" ? -1 : 1;
          event.preventDefault();
          if (pathname.includes("budgets")) {
            setAnchorDate(shiftMonthIso(anchorDate, delta));
          } else if (
            pathname === "/" ||
            pathname.includes("analysis") ||
            pathname.includes("index") ||
            pathname.includes("accounts") ||
            pathname.includes("categories")
          ) {
            shiftPeriod(delta);
          }
          return;
        }

        const digit = Number(event.key);
        const pane = PANE_BY_DIGIT[digit];
        if (pane) {
          event.preventDefault();
          openPane(pane);
          router.navigate("/");
        }
      },
      [
        anchorDate,
        canSplit,
        enterSplit,
        mode,
        openHelp,
        openPane,
        pathname,
        router,
        setAnchorDate,
        setMode,
        shiftPeriod,
      ],
    ),
    { ignoreWhenTyping: true },
  );

  return null;
}
