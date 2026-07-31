import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { AccountPeriodSlice } from "@/db/analysis";
import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

type Props = {
  accounts: AccountPeriodSlice[];
};

export function AccountBars({ accounts }: Props) {
  const max = Math.max(
    ...accounts.flatMap((a) => [a.expense, a.income]),
    1,
  );

  if (accounts.length === 0) {
    return (
      <Text style={styles.empty}>No account activity in this period</Text>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.chart}>
        {accounts.map((a) => (
          <View key={a.accountId} style={styles.group}>
            <View style={styles.bars}>
              <View
                style={[
                  styles.bar,
                  styles.barExpense,
                  {
                    height: a.expense > 0 ? Math.max(4, (a.expense / max) * 120) : 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  styles.barIncome,
                  {
                    height: a.income > 0 ? Math.max(4, (a.income / max) * 120) : 0,
                  },
                ]}
              />
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {a.name}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AccountPeriodList({ accounts }: Props) {
  if (accounts.length === 0) return null;
  return (
    <View style={styles.list}>
      {accounts.map((a) => (
        <View key={a.accountId} style={styles.row}>
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
          <Text style={styles.periodTag}>This period</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { marginTop: 12 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    paddingHorizontal: 8,
    minHeight: 160,
  },
  group: {
    width: 56,
    alignItems: "center",
    gap: 6,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 120,
  },
  bar: {
    width: 16,
    borderRadius: 3,
    minHeight: 4,
  },
  barExpense: { backgroundColor: colors.expense },
  barIncome: { backgroundColor: colors.income },
  name: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: "center",
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
  list: { marginTop: 20, gap: 12 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    gap: 4,
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
  periodTag: { color: colors.textSecondary, fontSize: 12 },
});
