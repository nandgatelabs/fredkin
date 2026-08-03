import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/GlassSurface";
import { log } from "@/lib/logger";
import { webClickable, webFocusableProps, webFontBody } from "@/lib/web";
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

/** Fixed center column so + sits on the true horizontal midpoint. */
const CENTER_W = 52;

export function ShellTabBar({ state, navigation }: ShellTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Belt-and-suspenders: web uses header nav (`_layout.web` / ShellTabBar.web).
  if (Platform.OS === "web") return null;

  const activeName = state.routes[state.index]?.name ?? "index";

  const padBottom = Math.max(insets.bottom, 8);
  const barHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <GlassSurface
      style={[styles.bar, { height: barHeight, paddingBottom: padBottom }]}
    >
      <View style={styles.side}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Events"
          accessibilityState={{ selected: activeName === "index" }}
          onPress={() => {
            log.debug("ui tab", { tab: "events" });
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
            color={activeName === "index" ? colors.accent : colors.tabInactive}
          />
          <Text
            style={[styles.tabLabel, activeName === "index" && styles.labelActive]}
          >
            Events
          </Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add event"
          onPress={() => {
            log.debug("ui add event");
            router.push("/record/new");
          }}
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
          accessibilityLabel="Insights"
          accessibilityState={{ selected: activeName === "analysis" }}
          onPress={() => {
            log.debug("ui tab", { tab: "insights" });
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
            color={activeName === "analysis" ? colors.accent : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabLabel,
              activeName === "analysis" && styles.labelActive,
            ]}
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
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
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
