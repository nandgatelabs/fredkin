import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { GlassSurface } from "@/components/GlassSurface";
import { webClickable, webFocusableProps, webFontBody } from "@/lib/web";
import { useEffectiveDesktopView } from "@/hooks/useEffectiveDesktopView";
import { useCanSplit } from "@/hooks/useViewportWidth";
import { useDesktopViewStore } from "@/store/desktopView";
import { colors } from "@/theme";

type ShellTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    navigate: (name: string) => void;
  };
};

const CENTER_W = 52;

/**
 * Web tab bar: same Events · + · Insights chrome.
 * Split is default; Events / Insights open that pane full-screen.
 * Tap the active full-screen tab again to return to split.
 */
export function ShellTabBar({ navigation }: ShellTabBarProps) {
  const router = useRouter();
  const preferred = useDesktopViewStore((s) => s.view);
  const setView = useDesktopViewStore((s) => s.setView);
  const view = useEffectiveDesktopView();
  const canSplit = useCanSplit();

  const eventsActive = view === "events";
  const insightsActive = view === "insights";

  return (
    <GlassSurface style={styles.bar}>
      <View style={styles.side}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            eventsActive && canSplit
              ? "Events, tap again for split view"
              : "Events"
          }
          accessibilityState={{ selected: eventsActive }}
          onPress={() => {
            if (preferred === "events" && canSplit) {
              setView("split");
              navigation.navigate("index");
              return;
            }
            setView("events");
            navigation.navigate("index");
          }}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.tabItem,
            webClickable,
            pressed && styles.itemPressed,
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color={eventsActive ? colors.accent : colors.tabInactive}
          />
          <Text style={[styles.tabLabel, eventsActive && styles.labelActive]}>
            Events
          </Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add event"
          onPress={() => router.push("/record/new")}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.addBtn,
            webClickable,
            pressed && styles.addPressed,
          ]}
        >
          <Ionicons name="add" size={22} color={colors.onAccent} />
        </Pressable>
      </View>

      <View style={styles.side}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            insightsActive ? "Insights, tap again for split view" : "Insights"
          }
          accessibilityState={{ selected: insightsActive }}
          onPress={() => {
            if (preferred === "insights" && canSplit) {
              setView("split");
              navigation.navigate("index");
              return;
            }
            setView("insights");
            navigation.navigate("analysis");
          }}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.tabItem,
            webClickable,
            pressed && styles.itemPressed,
          ]}
        >
          <Ionicons
            name="pie-chart-outline"
            size={22}
            color={insightsActive ? colors.accent : colors.tabInactive}
          />
          <Text
            style={[styles.tabLabel, insightsActive && styles.labelActive]}
          >
            Insights
          </Text>
        </Pressable>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 72,
    paddingBottom: 12,
    paddingTop: 6,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  side: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    width: CENTER_W,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  tabLabel: {
    color: colors.tabInactive,
    fontSize: 11,
    fontWeight: "500",
    fontFamily: webFontBody,
  },
  labelActive: {
    color: colors.accent,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  addPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  itemPressed: {
    backgroundColor: colors.accentSoft,
  },
});
