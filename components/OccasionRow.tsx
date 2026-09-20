import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { OccasionListRow } from "@/lib/occasionsUi";
import { formatMoney } from "@/lib/money";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  row: OccasionListRow;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
  dropHighlight?: boolean;
};

export function OccasionRow({
  row,
  expanded,
  onToggle,
  onOpen,
  dropHighlight = false,
}: Props) {
  const count = row.members.length;
  const people = [
    ...new Set(row.members.map((m) => m.person_name).filter(Boolean)),
  ] as string[];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.occasion.title}, ${count} events`}
      accessibilityHint="Long press for occasion options"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      onLongPress={onOpen}
      delayLongPress={350}
      {...webFocusableProps}
      style={({ pressed }) => [
        styles.row,
        webClickable,
        pressed && styles.pressed,
        dropHighlight && styles.drop,
      ]}
    >
      <View style={styles.icon}>
        <Ionicons name="albums-outline" size={18} color="#fff" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {row.occasion.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {count} event{count === 1 ? "" : "s"}
          {people.length ? `  · ${people.join(", ")}` : ""}
        </Text>
      </View>
      <View style={styles.totals}>
        {row.expense > 0 ? (
          <Text style={[styles.amount, { color: colors.expense }]}>
            {formatMoney(row.expense, { sign: "never" })}
          </Text>
        ) : null}
        {row.income > 0 ? (
          <Text style={[styles.amount, { color: colors.income }]}>
            {formatMoney(row.income, { sign: "never" })}
          </Text>
        ) : null}
        {row.expense <= 0 && row.income <= 0 ? (
          <Text style={[styles.amount, { color: colors.textSecondary }]}>
            {formatMoney(0, { sign: "never" })}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={18}
        color={colors.accentMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pressed: { backgroundColor: colors.accentSoft },
  drop: { backgroundColor: colors.accentSoft },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.transfer,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0, gap: 3 },
  title: { color: colors.text, fontSize: 15, fontWeight: "700" },
  meta: { color: colors.textSecondary, fontSize: 12 },
  totals: { alignItems: "flex-end", gap: 2 },
  amount: { fontSize: 15, fontWeight: "700" },
});
