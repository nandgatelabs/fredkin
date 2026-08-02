import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

import { GlassSurface } from "@/components/GlassSurface";
import { isMorePath } from "@/components/shell/morePaths";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { useDesktopViewStore } from "@/store/desktopView";
import { useMorePaneStore } from "@/store/morePane";
import { colors, layout } from "@/theme";

/**
 * Web header: Fredkin · capped search · Split · More.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const openMore = useMorePaneStore((s) => s.openMore);
  const moreActive = isMorePath(pathname);
  const view = useDesktopViewStore((s) => s.view);
  const setView = useDesktopViewStore((s) => s.setView);
  const splitActive = view === "split";

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Split view"
        accessibilityState={{ selected: splitActive }}
        onPress={() => {
          setView("split");
          router.navigate("/");
        }}
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
          size={20}
          color={splitActive ? colors.accent : colors.tabInactive}
        />
        <Text style={[styles.splitLabel, splitActive && styles.splitLabelActive]}>
          Split
        </Text>
      </Pressable>

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
          size={22}
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
    gap: 12,
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
    minHeight: 38,
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
  splitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: "600",
  },
  splitLabelActive: {
    color: colors.accent,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: "600",
  },
  moreLabelActive: {
    color: colors.accent,
  },
});

