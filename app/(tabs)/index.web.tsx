import { Redirect } from "expo-router";

import { DesktopSplitHome } from "@/components/shell/DesktopSplitHome";
import { EventsHome } from "@/components/shell/EventsHome";
import { useEffectiveDesktopView } from "@/hooks/useEffectiveDesktopView";

/**
 * Web home: split (default, wide only) or full Events.
 * Full Insights lives on the analysis route.
 */
export default function EventsScreenWeb() {
  const view = useEffectiveDesktopView();

  if (view === "insights") {
    return <Redirect href="/analysis" />;
  }
  if (view === "split") {
    return <DesktopSplitHome />;
  }
  return <EventsHome />;
}
