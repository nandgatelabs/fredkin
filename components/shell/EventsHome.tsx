import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { EventsPane } from "@/components/events/EventsPane";
import { colors } from "@/theme";

/** Full-width Events (native tab / web full-screen mode). */
export function EventsHome() {
  return (
    <View style={styles.root}>
      <GlassAtmosphere />
      <AppHeader />
      <EventsPane />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
