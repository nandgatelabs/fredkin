import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";

import { MorePane } from "@/components/MorePane";
import { isMoreStackPath } from "@/components/shell/morePaths";
import { useMorePaneStore } from "@/store/morePane";

/** Mount once near the app root so the native edge drawer can reopen after stack Back. */
export function MorePaneHost() {
  const pathname = usePathname();
  const open = useMorePaneStore((s) => s.open);
  const returnToMore = useMorePaneStore((s) => s.returnToMore);
  const closeMore = useMorePaneStore((s) => s.closeMore);
  const openMore = useMorePaneStore((s) => s.openMore);
  const prevPath = useRef(pathname);

  useEffect(() => {
    const wasStack = isMoreStackPath(prevPath.current);
    const nowStack = isMoreStackPath(pathname);
    prevPath.current = pathname;

    // Only reopen after leaving a More stack screen (Settings → shell),
    // never on the outbound Settings push (shell → Settings).
    if (!returnToMore || open) return;
    if (!wasStack || nowStack) return;
    openMore();
  }, [pathname, returnToMore, open, openMore]);

  return <MorePane visible={open} onClose={closeMore} />;
}
