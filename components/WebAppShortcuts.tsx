import { useCallback } from "react";
import { usePathname, useRouter } from "expo-router";

import { useCanSplit } from "@/hooks/useViewportWidth";
import { useKeydown } from "@/hooks/useKeydown";
import { useDesktopViewStore } from "@/store/desktopView";
import { usePeriodStore } from "@/store/period";

/** 1–2 = main panes; 3–4 = More destinations (still keyboard-reachable). */
const TAB_ROUTES = ["/", "/analysis", "/accounts", "/categories"] as const;

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
 * ⌘/Ctrl+K or / search · n new · s toggle split · ← → period · 1–4 destinations
 */
export function WebAppShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const setAnchorDate = usePeriodStore((s) => s.setAnchorDate);
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const view = useDesktopViewStore((s) => s.view);
  const setView = useDesktopViewStore((s) => s.setView);
  const canSplit = useCanSplit();

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

        if (event.key === "/" || event.key === "?") {
          event.preventDefault();
          router.push("/search");
          return;
        }

        if (event.key === "n" || event.key === "N") {
          event.preventDefault();
          router.push("/record/new");
          return;
        }

        if ((event.key === "s" || event.key === "S") && canSplit) {
          event.preventDefault();
          if (view === "split") {
            setView("events");
          } else {
            setView("split");
          }
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
            pathname.includes("index")
          ) {
            shiftPeriod(delta);
          }
          return;
        }

        const digit = Number(event.key);
        if (digit >= 1 && digit <= TAB_ROUTES.length) {
          event.preventDefault();
          if (digit === 1) setView("events");
          if (digit === 2) setView("insights");
          router.push(TAB_ROUTES[digit - 1] as never);
        }
      },
      [
        anchorDate,
        canSplit,
        pathname,
        router,
        setAnchorDate,
        setView,
        shiftPeriod,
        view,
      ],
    ),
    { ignoreWhenTyping: true },
  );

  return null;
}
