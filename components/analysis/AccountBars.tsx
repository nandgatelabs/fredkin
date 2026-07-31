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

export function AccountBars({
  accounts,
  selectedId = null,
  onSelect,
}: Props) {
  const max = Math.max(...accounts.flatMap((a) => [a.expense, a.income]), 1);
  const selected = accounts.find((a) => a.accountId === selectedId) ?? null;

  if (accounts.length === 0) {
    return (
      <Text style={styles.empty}>No account activity in this period</Text>
    );
  }

  return (
    <View>
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
      ) : (
        <Text style={styles.hint}>Tap an account’s bars for details</Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.chart}
      >
        {accounts.map((a) => {
          const active = selectedId === a.accountId;
          const expH = a.expense > 0 ? Math.max(8, (a.expense / max) * 140) : 0;
          const incH = a.income > 0 ? Math.max(8, (a.income / max) * 140) : 0;
          return (
            <Pressable
              key={a.accountId}
              onPress={() => onSelect?.(active ? null : a.accountId)}
              style={[styles.group, webClickable, active && styles.groupActive]}
            >
              <View style={styles.bars}>
                <View style={styles.barCol}>
                  <View
                    style={[styles.bar, styles.barExpense, { height: expH }]}
                  />
                </View>
                <View style={styles.barCol}>
                  <View
                    style={[styles.bar, styles.barIncome, { height: incH }]}
                  />
                </View>
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
            onPress={() => onSelect?.(active ? null : a.accountId)}
            style={[styles.row, webClickable, active && styles.rowActive]}
          >
            <Text style={styles.rowName} numberOfLines={1}>
              {a.name}
            </Text>
            <View style={styles.rowAmounts}>
              <Text style={styles.expense}>
                {formatMoney(-a.expense, { sign: "auto" })}
              </Text>
              <Text style={styles.income}>
                {formatMoney(a.income, { sign: "auto" })}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  tooltip: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surfaceElevated,
    gap: 6,
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
  scroll: { marginTop: 12 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 4,
    minHeight: 190,
  },
  group: {
    width: 64,
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  groupActive: {
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 140,
  },
  barCol: {
    width: 18,
    height: 140,
    justifyContent: "flex-end",
    backgroundColor: colors.borderSubtle,
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
  },
  barExpense: { backgroundColor: colors.expense },
  barIncome: { backgroundColor: colors.income },
  name: {
    color: colors.textSecondary,
    fontSize: 11,
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
    gap: 6,
  },
  rowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  rowName: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 15,
  },
  rowAmounts: {
    flexDirection: "row",
    gap: 16,
  },
  expense: { color: colors.expense, fontWeight: "600", fontSize: 14 },
  income: { color: colors.income, fontWeight: "600", fontSize: 14 },
});
