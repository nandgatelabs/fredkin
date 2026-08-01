import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { AppDrawer } from "@/components/AppDrawer";
import { GlassSurface } from "@/components/GlassSurface";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  onMenuPress?: () => void;
};

export function AppHeader({ onMenuPress }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <GlassSurface style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo} accessibilityRole="header">
        Fredkin
      </Text>

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open settings menu"
        onPress={() => {
          if (onMenuPress) onMenuPress();
          else setDrawerOpen(true);
        }}
        hitSlop={12}
        {...webFocusableProps}
        style={({ pressed }) => [
          styles.iconBtn,
          webClickable,
          pressed && styles.iconBtnActive,
        ]}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.accent} />
      </Pressable>

      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
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
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    flexShrink: 0,
  },
  iconBtnActive: {
    backgroundColor: colors.accentSoft,
  },
});
