import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

import { GlassSurface } from "@/components/GlassSurface";
import { isMorePath } from "@/components/shell/morePaths";
import { log } from "@/lib/logger";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { useMorePaneStore } from "@/store/morePane";
import { colors } from "@/theme";

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const openMore = useMorePaneStore((s) => s.openMore);
  const moreActive = isMorePath(pathname);

  return (
    <GlassSurface style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo} accessibilityRole="header">
        Fredkin
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search events"
        onPress={() => {
          log.debug("ui search open");
          router.push("/search");
        }}
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open more"
        accessibilityState={{ selected: moreActive }}
        onPress={() => {
          log.debug("ui more open", { via: "header" });
          openMore();
        }}
        hitSlop={8}
        {...webFocusableProps}
        style={({ pressed }) => [
          styles.moreBtn,
          webClickable,
          moreActive && styles.moreBtnActive,
          pressed && styles.moreBtnPressed,
        ]}
      >
        <Ionicons
          name="menu"
          size={22}
          color={moreActive ? colors.accent : colors.tabInactive}
        />
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
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
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 38,
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
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
  },
  moreBtn: {
    width: 40,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtnActive: {
    backgroundColor: colors.accentSoft,
  },
  moreBtnPressed: {
    opacity: 0.85,
  },
});
