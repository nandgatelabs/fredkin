import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { EventsPane } from "@/components/events/EventsPane";
import { InsightsPane } from "@/components/insights/InsightsPane";
import { colors } from "@/theme";

/**
 * Web desktop split: Events | Insights.
 * Primary nav (Events · + · Insights · Split) lives in the header.
 */
export function DesktopSplitHome() {
  return (
    <View style={styles.root}>
      <GlassAtmosphere />
      <AppHeader />
      <View style={styles.split}>
        <View style={styles.pane}>
          <EventsPane listBottomPad={24} />
        </View>
        <View style={styles.divider} />
        <View style={styles.pane}>
          <InsightsPane showDisplayOptions contentBottomPad={40} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  split: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  pane: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
});
