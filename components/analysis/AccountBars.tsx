import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { AccountPeriodSlice } from "@/db/analysis";
import { formatMoney } from "@/lib/money";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  accounts: AccountPeriodSlice[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
};

const CHART_H = 160;

function axisTicks(max: number) {
  return [max, (max * 2) / 3, max / 3, 0];
}

export function AccountBars({
  accounts,
  selectedId = null,
  onSelect,
}: Props) {
  const max = Math.max(...accounts.flatMap((a) => [a.expense, a.income]), 1);
  const ticks = axisTicks(max);
  const selected = accounts.find((a) => a.accountId === selectedId) ?? null;

  if (accounts.length === 0) {
    return (
      <Text style={styles.empty}>No account activity in this period</Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.expense }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.income }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
      </View>

      {selected ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipName}>{selected.name}</Text>
          <View style={styles.tooltipRow}>
            <Text style={styles.expense}>
              Expense {formatMoney(-selected.expense, { sign: "auto" })}
            </Text>
            <Text style={styles.income}>
              Income {formatMoney(selected.income, { sign: "auto" })}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.chartRow}>
        <View style={[styles.yAxis, { height: CHART_H }]}>
          {ticks.map((v, i) => (
            <Text key={i} style={styles.yLabel} numberOfLines={1}>
              {formatMoney(v, { sign: "never" })}
            </Text>
          ))}
        </View>

        <View style={styles.plot}>
          <View style={[styles.gridLines, { height: CHART_H }]} pointerEvents="none">
            {ticks.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.gridLine,
                  i === ticks.length - 1 && styles.gridLineBase,
                ]}
              />
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.barsRow, { minHeight: CHART_H + 36 }]}
          >
            {accounts.map((a) => {
              const active = selectedId === a.accountId;
              const expH = a.expense > 0 ? Math.max(6, (a.expense / max) * CHART_H) : 0;
              const incH = a.income > 0 ? Math.max(6, (a.income / max) * CHART_H) : 0;
              return (
                <Pressable
                  key={a.accountId}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.name} details`}
                  onPress={() => onSelect?.(a.accountId)}
                  style={[styles.group, webClickable, active && styles.groupActive]}
                >
                  <View style={[styles.bars, { height: CHART_H }]}>
                    <View style={[styles.bar, styles.barExpense, { height: expH }]} />
                    <View style={[styles.bar, styles.barIncome, { height: incH }]} />
                  </View>
                  <Text
                    style={[styles.name, active && styles.nameActive]}
                    numberOfLines={2}
                  >
                    {a.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

export function AccountPeriodList({
  accounts,
  selectedId = null,
  onSelect,
}: Props) {
  if (accounts.length === 0) return null;
  return (
    <View style={styles.list}>
      {accounts.map((a) => {
        const active = selectedId === a.accountId;
        return (
          <Pressable
            key={a.accountId}
            accessibilityRole="button"
            accessibilityLabel={`${a.name} details`}
            onPress={() => onSelect?.(a.accountId)}
            style={[styles.row, webClickable, active && styles.rowActive]}
          >
            <Text style={styles.rowName} numberOfLines={1}>
              {a.name}
            </Text>
            <View style={styles.rowAmounts}>
              <View style={[styles.pill, styles.pillExpense]}>
                <Text style={styles.expense}>
                  {formatMoney(-a.expense, { sign: "auto" })}
                </Text>
              </View>
              <View style={[styles.pill, styles.pillIncome]}>
                <Text style={styles.income}>
                  {formatMoney(a.income, { sign: "auto" })}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  legendRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    marginBottom: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 2 },
  legendText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  tooltip: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    gap: 6,
    marginBottom: 10,
  },
  tooltipName: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  tooltipRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  chartRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  yAxis: {
    width: 72,
    justifyContent: "space-between",
    paddingTop: 0,
  },
  yLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "right",
  },
  plot: {
    flex: 1,
    position: "relative",
  },
  gridLines: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    zIndex: 0,
  },
  gridLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    width: "100%",
  },
  gridLineBase: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  group: {
    width: 58,
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 2,
  },
  groupActive: {
    backgroundColor: "rgba(232, 212, 138, 0.12)",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    width: "100%",
    justifyContent: "center",
  },
  bar: {
    width: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barExpense: { backgroundColor: colors.expense },
  barIncome: { backgroundColor: colors.income },
  name: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  nameActive: {
    color: colors.accent,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
  list: { marginTop: 20, gap: 10 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  rowActive: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  rowName: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 15,
  },
  rowAmounts: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillExpense: {
    borderColor: colors.expense,
    backgroundColor: "rgba(232, 154, 132, 0.1)",
  },
  pillIncome: {
    borderColor: colors.income,
    backgroundColor: "rgba(143, 207, 146, 0.1)",
  },
  expense: { color: colors.expense, fontWeight: "700", fontSize: 13 },
  income: { color: colors.income, fontWeight: "700", fontSize: 13 },
});
