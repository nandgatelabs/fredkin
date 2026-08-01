import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/GlassSurface";
import { MorePane } from "@/components/MorePane";
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

const MAIN_TABS = [
  {
    name: "index",
    label: "Events",
    icon: "receipt-outline" as const,
  },
  {
    name: "analysis",
    label: "Insights",
    icon: "pie-chart-outline" as const,
  },
] as const;

const MORE_ROUTES = new Set(["accounts", "categories", "budgets"]);

export function ShellTabBar({ state, navigation }: ShellTabBarProps) {
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeName = state.routes[state.index]?.name ?? "index";
  const moreActive = MORE_ROUTES.has(activeName);

  const padBottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const barHeight = Platform.OS === "web" ? 72 : 56 + Math.max(insets.bottom, 8);

  return (
    <>
      <GlassSurface
        style={[styles.bar, { height: barHeight, paddingBottom: padBottom }]}
      >
        <View style={styles.side} />

        <View style={styles.center}>
          {MAIN_TABS.map((tab) => {
            const active = activeName === tab.name;
            return (
              <Pressable
                key={tab.name}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                onPress={() => navigation.navigate(tab.name)}
                {...webFocusableProps}
                style={({ pressed }) => [
                  styles.mainItem,
                  webClickable,
                  pressed && styles.itemPressed,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={active ? colors.accent : colors.tabInactive}
                />
                <Text style={[styles.mainLabel, active && styles.labelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sideRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More"
            accessibilityState={{ selected: moreActive }}
            onPress={() => setMoreOpen(true)}
            {...webFocusableProps}
            style={({ pressed }) => [
              styles.moreItem,
              webClickable,
              pressed && styles.itemPressed,
            ]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={moreActive || moreOpen ? colors.accent : colors.tabInactive}
            />
            <Text
              style={[
                styles.moreLabel,
                (moreActive || moreOpen) && styles.labelActive,
              ]}
            >
              More
            </Text>
          </Pressable>
        </View>
      </GlassSurface>

      <MorePane visible={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  side: {
    flex: 1,
  },
  sideRight: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainItem: {
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  moreItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    minWidth: 48,
  },
  itemPressed: {
    backgroundColor: colors.accentSoft,
  },
  mainLabel: {
    color: colors.tabInactive,
    fontSize: 11,
    fontWeight: "500",
    fontFamily: webFontBody,
  },
  moreLabel: {
    color: colors.tabInactive,
    fontSize: 10,
    fontWeight: "500",
    fontFamily: webFontBody,
  },
  labelActive: {
    color: colors.accent,
  },
});
