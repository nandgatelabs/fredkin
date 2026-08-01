import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { formatMoney } from "@/lib/money";
import { formatPeriodLabel } from "@/lib/period";
import { webClickable, webFocusableProps } from "@/lib/web";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  onFilterPress?: () => void;
  showSummary?: boolean;
  expense?: number;
  income?: number;
  /** Extra amount added to Net (carry-over). */
  carryAmount?: number;
};

export function PeriodHeader({
  onFilterPress,
  showSummary = true,
  expense = 0,
  income = 0,
  carryAmount = 0,
}: Props) {
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const showTotal = useSettingsStore((s) => s.showTotal);

  const total = income - expense + carryAmount;
  const label = formatPeriodLabel(anchorDate, viewMode);

  return (
    <View style={styles.wrap}>
      <View style={styles.periodRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous period"
          onPress={() => shiftPeriod(-1)}
          hitSlop={10}
          {...webFocusableProps}
          style={[styles.chevron, webClickable]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </Pressable>

        <Text style={styles.periodLabel} accessibilityRole="header">
          {label}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next period"
          onPress={() => shiftPeriod(1)}
          hitSlop={10}
          {...webFocusableProps}
          style={[styles.chevron, webClickable]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.accent} />
        </Pressable>

        {onFilterPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Display options"
            onPress={onFilterPress}
            hitSlop={10}
            {...webFocusableProps}
            style={[styles.filter, webClickable]}
          >
            <Ionicons name="options-outline" size={18} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>

      {showSummary && showTotal ? (
        <View style={styles.summaryRow}>
          <SummaryCol label="SPEND" value={expense} tone="expense" signed={false} />
          <SummaryCol label="INCOME" value={income} tone="income" signed={false} />
          <SummaryCol
            label="NET"
            value={total}
            tone={total >= 0 ? "income" : "expense"}
            signed
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
  signed,
}: {
  label: string;
  value: number;
  tone: "expense" | "income";
  signed: boolean;
}) {
  const color = tone === "expense" ? colors.expense : colors.income;

  return (
    <View style={styles.summaryCol}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1}>
        {formatMoney(value, { sign: signed ? "auto" : "never" })}
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
