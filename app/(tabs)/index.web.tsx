import { Redirect } from "expo-router";

import { DesktopSplitHome } from "@/components/shell/DesktopSplitHome";
import { EventsHome } from "@/components/shell/EventsHome";
import { useDesktopViewStore } from "@/store/desktopView";

/**
 * Web home: split (default) or full Events.
 * Full Insights lives on the analysis route.
 */
export default function EventsScreenWeb() {
  const view = useDesktopViewStore((s) => s.view);

  if (view === "insights") {
    return <Redirect href="/analysis" />;
  }
  if (view === "split") {
    return <DesktopSplitHome />;
  }
  return <EventsHome />;
}
