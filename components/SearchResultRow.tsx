import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { RecordListItem } from "@/db/records";
import { HighlightedText } from "@/lib/highlight";
import {
  categoryColor,
  categoryIcon,
} from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import {
  parseOccurredAt,
  recordTitle,
  signedDisplayAmount,
} from "@/lib/recordsUi";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Props = {
  item: RecordListItem;
  query: string;
  onPress: () => void;
};

export function SearchResultRow({ item, query, onPress }: Props) {
  const title = recordTitle(item);
  const amount = signedDisplayAmount(item);
  const amountColor =
    item.type === "transfer"
      ? colors.transfer
      : item.type === "income"
        ? colors.income
        : colors.expense;
  const iconBg =
    item.type === "transfer"
      ? colors.transfer
      : (item.category_color ?? categoryColor(item.category_icon_key ?? "pricetag"));
  const iconName =
    item.type === "transfer"
      ? "swap-horizontal"
      : categoryIcon(item.category_icon_key ?? "pricetag");

  const d = parseOccurredAt(item.occurred_at);
  const dateLabel = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const metaNote = item.note.trim();
  const metaLine = metaNote ? `${dateLabel} • ${metaNote}` : dateLabel;

  const accountLabel =
    item.type === "transfer"
      ? `${item.account_name} → ${item.to_account_name ?? "?"}`
      : item.account_name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      {...webFocusableProps}
      style={({ pressed }) => [styles.row, webClickable, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={18} color="#fff" />
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <HighlightedText
            text={title}
            query={query}
            style={styles.title}
            numberOfLines={1}
          />
          <Text style={[styles.amount, { color: amountColor }]}>
            {item.type === "transfer"
              ? formatMoney(item.amount, { sign: "never" })
              : formatMoney(amount, { sign: "auto" })}
          </Text>
        </View>
        <HighlightedText
          text={accountLabel}
          query={query}
          style={styles.account}
          numberOfLines={1}
        />
        <HighlightedText
          text={metaLine}
          query={query}
          style={styles.meta}
          numberOfLines={2}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: {
    backgroundColor: "rgba(232, 212, 138, 0.06)",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
  account: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
