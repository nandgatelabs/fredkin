import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { donutColor } from "@/components/analysis/DonutChart";
import type { CategorySlice } from "@/db/analysis";
import { categoryColor, categoryIcon } from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

type Props = {
  slices: CategorySlice[];
  tone: "expense" | "income";
};

export function CategoryLegend({ slices }: Props) {
  return (
    <View style={styles.legend}>
      {slices.map((s, i) => (
        <View key={s.categoryId ?? s.name} style={styles.legendRow}>
          <View
            style={[styles.swatch, { backgroundColor: donutColor(i, s.color) }]}
          />
          <Text style={styles.legendName} numberOfLines={1}>
            {s.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function CategoryBreakdownList({ slices, tone }: Props) {
  const amountColor = tone === "expense" ? colors.expense : colors.income;

  if (slices.length === 0) {
    return (
      <Text style={styles.empty}>
        No {tone === "expense" ? "expenses" : "income"} in this period
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {slices.map((s, i) => {
        const color = donutColor(i, s.color ?? categoryColor(s.iconKey));
        const signed = tone === "expense" ? -s.amount : s.amount;
        return (
          <View key={s.categoryId ?? s.name} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: color }]}>
              <Ionicons name={categoryIcon(s.iconKey)} size={18} color="#fff" />
            </View>
            <View style={styles.body}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={[styles.amount, { color: amountColor }]}>
                  {formatMoney(signed, { sign: "auto" })}
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.min(100, s.percent)}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={styles.percent}>{s.percent.toFixed(2)}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flex: 1, gap: 6, paddingLeft: 8, justifyContent: "center" },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendName: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  list: { marginTop: 16, gap: 14 },
  row: { flexDirection: "row", gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, color: colors.text, fontWeight: "600", fontSize: 15 },
  amount: { fontWeight: "700", fontSize: 14 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderSubtle,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  percent: { color: colors.textSecondary, fontSize: 12 },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
  },
});
