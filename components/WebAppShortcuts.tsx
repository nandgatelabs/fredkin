import { useCallback } from "react";
import { usePathname, useRouter } from "expo-router";

import { useKeydown } from "@/hooks/useKeydown";
import { usePeriodStore } from "@/store/period";

/** 1–2 = bottom tabs; 3–4 = More pane destinations (still keyboard-reachable). */
const TAB_ROUTES = ["/", "/analysis", "/accounts", "/categories"] as const;

function shiftMonthIso(iso: string, delta: number) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}-01`;
}

/**
 * Laptop keyboard shortcuts for main tabs (web only via useKeydown).
 * / search · n new record · ← → period · 1–4 tabs (Events, Insights, Wallets, Event Type)
 */
export function WebAppShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const setAnchorDate = usePeriodStore((s) => s.setAnchorDate);
  const anchorDate = usePeriodStore((s) => s.anchorDate);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        // Don't steal keys on modal/editor routes.
        if (
          pathname.startsWith("/record") ||
          pathname.startsWith("/search") ||
          pathname.startsWith("/import") ||
          pathname.startsWith("/export") ||
          pathname.startsWith("/backup") ||
          pathname.startsWith("/reset") ||
          pathname.startsWith("/preferences")
        ) {
          return;
        }

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

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          const delta = event.key === "ArrowLeft" ? -1 : 1;
          event.preventDefault();
          // Budgets is always month-scoped.
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
          router.push(TAB_ROUTES[digit - 1] as never);
        }
      },
      [anchorDate, pathname, router, setAnchorDate, shiftPeriod],
    ),
    { ignoreWhenTyping: true },
  );

  return null;
}
