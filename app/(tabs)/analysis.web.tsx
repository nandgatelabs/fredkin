import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

import { InsightsHome } from "@/components/shell/InsightsHome";
import { useDesktopViewStore } from "@/store/desktopView";

/**
 * Web Insights route: always full-screen Insights.
 * Opening this tab (or a deep link) exits split into full Insights.
 */
export default function AnalysisScreenWeb() {
  const setView = useDesktopViewStore((s) => s.setView);

  useFocusEffect(
    useCallback(() => {
      setView("insights");
    }, [setView]),
  );

  return <InsightsHome />;
}
