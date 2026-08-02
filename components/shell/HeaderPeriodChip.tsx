import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { formatPeriodLabel } from "@/lib/period";
import { webClickable, webFocusableProps } from "@/lib/web";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

/**
 * Shared period control for the web header (split mode).
 * Sized as a primary control so Insights stays clearly tied to the month.
 */
export function HeaderPeriodChip() {
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const label = formatPeriodLabel(anchorDate, viewMode);

  return (
    <View style={styles.chip} accessibilityRole="adjustable">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous period"
        onPress={() => shiftPeriod(-1)}
        hitSlop={8}
        {...webFocusableProps}
        style={[styles.chevron, webClickable]}
      >
        <Ionicons name="chevron-back" size={18} color={colors.accent} />
      </Pressable>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next period"
        onPress={() => shiftPeriod(1)}
        hitSlop={8}
        {...webFocusableProps}
        style={[styles.chevron, webClickable]}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexShrink: 1,
    maxWidth: 240,
  },
  chevron: {
    padding: 4,
    borderRadius: 999,
  },
  label: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    paddingHorizontal: 6,
    flexShrink: 1,
  },
});
