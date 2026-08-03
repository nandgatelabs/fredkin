import { useEffect, useRef } from "react";
import { usePathname, useSegments } from "expo-router";

import { log } from "@/lib/logger";

/** Logs route changes at debug level (verbose / __DEV__). */
export function NavigationLogger() {
  const pathname = usePathname();
  const segments = useSegments();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname} :: ${segments.join("/")}`;
    if (prev.current === key) return;
    const from = prev.current;
    prev.current = key;
    log.debug("nav", { pathname, segments, from });
  }, [pathname, segments]);

  return null;
}
