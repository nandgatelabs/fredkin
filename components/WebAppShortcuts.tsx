import { useCallback } from "react";
import { usePathname, useRouter } from "expo-router";

import { useCanSplit } from "@/hooks/useViewportWidth";
import { useKeydown } from "@/hooks/useKeydown";
import { log } from "@/lib/logger";
import { isWebDialogPath } from "@/lib/webDialog";
import { useDesktopViewStore, type PaneId } from "@/store/desktopView";
import { usePeriodStore } from "@/store/period";
import { useSearchModalStore } from "@/store/searchModal";
import { useShortcutsHelpStore } from "@/store/shortcutsHelp";

const PANE_BY_DIGIT: Record<number, PaneId> = {
  1: "events",
  2: "insights",
  3: "wallets",
  4: "categories",
  5: "people",
};

function shiftMonthIso(iso: string, delta: number) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

/**
 * Laptop keyboard shortcuts (web only via useKeydown).
 * ⌘/Ctrl+K or / search · M more · ? help · n new · s split · ← → period · 1–5 panes
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
  const openSearch = useSearchModalStore((s) => s.openSearch);
  const searchOpen = useSearchModalStore((s) => s.open);
  const onMore = pathname === "/more";
  const inDialog = isWebDialogPath(pathname);

  useKeydown(
    true,
    useCallback(
      (event) => {
        const mod = event.metaKey || event.ctrlKey;

        if (mod && (event.key === "k" || event.key === "K")) {
          event.preventDefault();
          log.debug("shortcut search", { key: "mod+k" });
          openSearch();
          return;
        }

        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (searchOpen) return;

        if (event.key === "m" || event.key === "M") {
          event.preventDefault();
          log.debug(onMore ? "shortcut more toggle close" : "shortcut more open");
          if (onMore) router.back();
          else router.navigate("/more");
          return;
        }

        // Digits while More is open are handled in MoreMenu.
        if (onMore) return;

        if (inDialog || pathname.startsWith("/record") || pathname.startsWith("/occasion")) return;

        if (event.key === "/") {
          event.preventDefault();
          log.debug("shortcut search", { key: "/" });
          openSearch();
          return;
        }

        if (event.key === "?") {
          event.preventDefault();
          log.debug("shortcut help");
          openHelp();
          return;
        }

        if (event.key === "n" || event.key === "N") {
          event.preventDefault();
          log.debug("shortcut new record");
          router.push("/record/new");
          return;
        }

        if ((event.key === "s" || event.key === "S") && canSplit) {
          event.preventDefault();
          log.debug(mode === "split" ? "shortcut split off" : "shortcut split on");
          if (mode === "split") setMode("single");
          else enterSplit();
          router.navigate("/");
          return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          const delta = event.key === "ArrowLeft" ? -1 : 1;
          event.preventDefault();
          log.debug("shortcut period", { delta, key: event.key });
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
          log.debug("shortcut pane", { pane, key: event.key });
          openPane(pane);
          router.navigate("/");
        }
      },
      [
        anchorDate,
        canSplit,
        enterSplit,
        inDialog,
        mode,
        onMore,
        openHelp,
        openPane,
        openSearch,
        pathname,
        router,
        searchOpen,
        setAnchorDate,
        setMode,
        shiftPeriod,
      ],
    ),
    { ignoreWhenTyping: true },
  );

  return null;
}
