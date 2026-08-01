import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { RecordListItem } from "@/db/records";
import { formatMoney } from "@/lib/money";
import {
  accountIcon,
  categoryColor,
  categoryIcon,
} from "@/lib/icons";
import { recordTitle, signedDisplayAmount } from "@/lib/recordsUi";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  item: RecordListItem;
  onPress: () => void;
};

export function RecordRow({ item, onPress }: Props) {
  const notesInList = useSettingsStore((s) => s.notesInList);
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
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.meta}>
          <Ionicons
            name={accountIcon(item.account_icon_key)}
            size={12}
            color={colors.accentMuted}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.type === "transfer"
              ? `${item.account_name} → ${item.to_account_name ?? "?"}`
              : item.account_name}
            {notesInList && item.note.trim() ? `  “${item.note.trim()}”` : ""}
          </Text>
        </View>
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>
        {item.type === "transfer"
          ? formatMoney(item.amount, { sign: "never" })
          : formatMoney(amount, { sign: "auto" })}
      </Text>
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
  pressed: {
    backgroundColor: colors.accentSoft,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
});
