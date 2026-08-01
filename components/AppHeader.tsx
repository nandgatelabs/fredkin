import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { GlassSurface } from "@/components/GlassSurface";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { colors } from "@/theme";

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
});
