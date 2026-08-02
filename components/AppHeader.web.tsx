import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

import { GlassSurface } from "@/components/GlassSurface";
import { HeaderPeriodChip } from "@/components/shell/HeaderPeriodChip";
import { isMorePath } from "@/components/shell/morePaths";
import { useEffectiveDesktopView } from "@/hooks/useEffectiveDesktopView";
import { useCanSplit } from "@/hooks/useViewportWidth";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { useDesktopViewStore } from "@/store/desktopView";
import { useMorePaneStore } from "@/store/morePane";
import { colors, layout } from "@/theme";

/**
 * Web header: Fredkin · search · period (split) · Events/+ /Insights · Split · More.
 * Replaces the mobile bottom tab bar on desktop.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const openMore = useMorePaneStore((s) => s.openMore);
  const moreActive = isMorePath(pathname);
  const preferred = useDesktopViewStore((s) => s.view);
  const setView = useDesktopViewStore((s) => s.setView);
  const view = useEffectiveDesktopView();
  const canSplit = useCanSplit();

  const splitActive = view === "split";
  const eventsActive = view === "events";
  const insightsActive = view === "insights";

  function goEvents() {
    if (preferred === "events" && canSplit) {
      setView("split");
      router.navigate("/");
      return;
    }
    setView("events");
    router.navigate("/");
  }

  function goInsights() {
    if (preferred === "insights" && canSplit) {
      setView("split");
      router.navigate("/");
      return;
    }
    setView("insights");
    router.navigate("/analysis");
  }

  function goSplit() {
    setView("split");
    router.navigate("/");
  }

  return (
    <GlassSurface style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo} accessibilityRole="header">
        Fredkin
      </Text>

      <View style={styles.searchWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search events"
          onPress={() => router.push("/search")}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.search,
            webClickable,
            pressed && styles.searchPressed,
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search
          </Text>
        </Pressable>
      </View>

      {splitActive ? <HeaderPeriodChip /> : null}

      <View style={styles.navCluster} accessibilityRole="toolbar">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            eventsActive && canSplit
              ? "Events, activate again for split view"
              : "Events"
          }
          accessibilityState={{ selected: eventsActive }}
          onPress={goEvents}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.navItem,
            webClickable,
            eventsActive && styles.navItemActive,
            pressed && styles.navItemPressed,
          ]}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={eventsActive ? colors.accent : colors.tabInactive}
          />
          <Text style={[styles.navLabel, eventsActive && styles.navLabelActive]}>
            Events
          </Text>
        </Pressable>

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
          <Ionicons name="add" size={20} color={colors.onAccent} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            insightsActive && canSplit
              ? "Insights, activate again for split view"
              : "Insights"
          }
          accessibilityState={{ selected: insightsActive }}
          onPress={goInsights}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.navItem,
            webClickable,
            insightsActive && styles.navItemActive,
            pressed && styles.navItemPressed,
          ]}
        >
          <Ionicons
            name="pie-chart-outline"
            size={18}
            color={insightsActive ? colors.accent : colors.tabInactive}
          />
          <Text
            style={[styles.navLabel, insightsActive && styles.navLabelActive]}
          >
            Insights
          </Text>
        </Pressable>
      </View>

      {canSplit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Split view"
          accessibilityState={{ selected: splitActive }}
          onPress={goSplit}
          hitSlop={10}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.splitBtn,
            webClickable,
            splitActive && styles.splitBtnActive,
            pressed && styles.splitBtnPressed,
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={18}
            color={splitActive ? colors.accent : colors.tabInactive}
          />
          <Text
            style={[styles.splitLabel, splitActive && styles.splitLabelActive]}
          >
            Split
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open more"
        accessibilityState={{ selected: moreActive }}
        onPress={openMore}
        hitSlop={10}
        {...webFocusableProps}
        style={({ pressed }) => [
          styles.moreBtn,
          webClickable,
          moreActive && styles.moreBtnActive,
          pressed && styles.moreBtnPressed,
        ]}
      >
        <Ionicons
          name="menu-outline"
          size={20}
          color={moreActive ? colors.accent : colors.tabInactive}
        />
        <Text style={[styles.moreLabel, moreActive && styles.moreLabelActive]}>
          More
        </Text>
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 0.4,
    fontFamily: webFontDisplay,
    flexShrink: 0,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
    maxWidth: layout.searchMaxWidth,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.inputBg,
  },
  searchPressed: {
    opacity: 0.88,
  },
  searchPlaceholder: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 14,
  },
  navCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  navItemActive: {
    backgroundColor: colors.accentSoft,
  },
  navItemPressed: {
    backgroundColor: colors.accentSoft,
  },
  navLabel: {
    color: colors.tabInactive,
    fontSize: 12,
    fontWeight: "600",
  },
  navLabelActive: {
    color: colors.accent,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    marginHorizontal: 2,
  },
  addPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  splitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    flexShrink: 0,
  },
  splitBtnActive: {
    backgroundColor: colors.accentSoft,
  },
  splitBtnPressed: {
    backgroundColor: colors.accentSoft,
  },
  splitLabel: {
    color: colors.tabInactive,
    fontSize: 12,
    fontWeight: "600",
  },
  splitLabelActive: {
    color: colors.accent,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    flexShrink: 0,
  },
  moreBtnActive: {
    backgroundColor: colors.accentSoft,
  },
  moreBtnPressed: {
    backgroundColor: colors.accentSoft,
  },
  moreLabel: {
    color: colors.tabInactive,
    fontSize: 12,
    fontWeight: "600",
  },
  moreLabelActive: {
    color: colors.accent,
  },
});
