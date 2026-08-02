import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { layout } from "@/theme/layout";

function readWidth() {
  if (Platform.OS !== "web" || typeof window === "undefined") return layout.splitMinWidth;
  return window.innerWidth;
}

/** Live viewport width (web). Native returns splitMinWidth so callers treat it as “wide enough”. */
export function useViewportWidth() {
  const [width, setWidth] = useState(readWidth);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

/** True when the viewport is wide enough for Events | Insights split. */
export function useCanSplit() {
  const width = useViewportWidth();
  return Platform.OS === "web" && width >= layout.splitMinWidth;
}
