import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { donutColor } from "@/components/analysis/DonutChart";
import type { CategorySlice } from "@/db/analysis";
import { categoryIcon } from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  slices: CategorySlice[];
  tone: "expense" | "income";
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
};

export function CategoryBreakdownList({
  slices,
  tone,
  selectedIndex = null,
  onSelect,
}: Props) {
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
        const color = donutColor(i);
        const signed = tone === "expense" ? -s.amount : s.amount;
        const active = selectedIndex === i;
        return (
          <Pressable
            key={s.categoryId ?? s.name}
            onPress={() => onSelect?.(active ? null : i)}
            style={[styles.row, webClickable, active && styles.rowActive]}
          >
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
                    {
                      width: `${Math.min(100, s.percent)}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.percent}>{s.percent.toFixed(2)}%</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 16, gap: 10 },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rowActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.08)",
  },
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
