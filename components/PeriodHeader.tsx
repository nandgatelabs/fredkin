import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { formatPeriodLabel } from "@/lib/period";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  onFilterPress?: () => void;
  showSummary?: boolean;
  expense?: number;
  income?: number;
};

export function PeriodHeader({
  onFilterPress,
  showSummary = true,
  expense = 0,
  income = 0,
}: Props) {
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const shiftMonths = usePeriodStore((s) => s.shiftMonths);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const showTotal = useSettingsStore((s) => s.showTotal);

  const total = income - expense;
  const label = formatPeriodLabel(anchorDate, viewMode);

  return (
    <View style={styles.wrap}>
      <View style={styles.periodRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous period"
          onPress={() => shiftMonths(-1)}
          hitSlop={10}
          style={styles.chevron}
        >
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </Pressable>

        <Text style={styles.periodLabel}>{label}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next period"
          onPress={() => shiftMonths(1)}
          hitSlop={10}
          style={styles.chevron}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.accent} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Display options"
          onPress={onFilterPress}
          hitSlop={10}
          style={styles.filter}
        >
          <Ionicons name="filter" size={18} color={colors.accent} />
        </Pressable>
      </View>

      {showSummary && showTotal ? (
        <View style={styles.summaryRow}>
          <SummaryCol label="EXPENSE" value={expense} tone="expense" />
          <SummaryCol label="INCOME" value={income} tone="income" />
          <SummaryCol
            label="TOTAL"
            value={total}
            tone={total >= 0 ? "income" : "expense"}
          />
        </View>
      ) : null}
    </View>
  );
}

function SummaryCol({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "expense" | "income";
}) {
  const color = tone === "expense" ? colors.expense : colors.income;
  const abs = Math.abs(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const text = `${value < 0 ? "-" : ""}₹${abs}`;

  return (
    <View style={styles.summaryCol}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevron: {
    padding: 4,
  },
  periodLabel: {
    flex: 1,
    textAlign: "center",
    color: colors.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  filter: {
    padding: 4,
    marginLeft: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
  },
});
