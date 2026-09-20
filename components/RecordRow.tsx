import { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

import type { RecordListItem } from "@/db/records";
import { formatMoney } from "@/lib/money";
import { isAdjustmentFlag, isLifestyleRole } from "@/lib/personRole";
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
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RecordRow({ item, onPress, onEdit, onDelete }: Props) {
  const notesInList = useSettingsStore((s) => s.notesInList);
  const swipeRef = useRef<Swipeable>(null);
  const title = recordTitle(item);
  const amount = signedDisplayAmount(item);
  const amountColor =
    isAdjustmentFlag(item.is_adjustment) ||
    item.type === "transfer" ||
    !isLifestyleRole(item.person_role)
      ? colors.transfer
      : item.type === "income"
        ? colors.income
        : colors.expense;

  const iconBg = isAdjustmentFlag(item.is_adjustment)
    ? colors.transfer
    : item.type === "transfer"
      ? colors.transfer
      : (item.category_color ?? categoryColor(item.category_icon_key ?? "pricetag"));

  const iconName = isAdjustmentFlag(item.is_adjustment)
    ? "swap-vertical"
    : item.type === "transfer"
      ? "swap-horizontal"
      : categoryIcon(item.category_icon_key ?? "pricetag");

  const row = (
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
            {item.person_name ? `  · ${item.person_name}` : ""}
          </Text>
        </View>
        {notesInList && item.note.trim() ? (
          <Text style={styles.note} numberOfLines={1}>
            {item.note.trim()}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>
        {item.type === "transfer"
          ? formatMoney(item.amount, { sign: "never" })
          : formatMoney(amount, { sign: "auto" })}
      </Text>
    </Pressable>
  );

  const canEdit = Boolean(onEdit) && !isAdjustmentFlag(item.is_adjustment);

  if (Platform.OS === "web" || (!canEdit && !onDelete)) {
    return row;
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={
        canEdit
          ? () => (
              <View style={styles.leftWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit event"
                  onPress={() => {
                    swipeRef.current?.close();
                    onEdit?.();
                  }}
                  style={[styles.actionBtn, styles.editBtn]}
                >
                  <Ionicons name="pencil" size={18} color={colors.accent} />
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>
                    Edit
                  </Text>
                </Pressable>
              </View>
            )
          : undefined
      }
      renderRightActions={
        onDelete
          ? () => (
              <View style={styles.rightWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete event"
                  onPress={() => {
                    swipeRef.current?.close();
                    onDelete();
                  }}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={[styles.actionLabel, { color: colors.danger }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            )
          : undefined
      }
    >
      {row}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    // Transparent so Glass Mist / atmosphere shows through (no solid slab).
    backgroundColor: "transparent",
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
    minWidth: 0,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
    color: colors.textSecondary,
    fontSize: 12,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  leftWrap: {
    justifyContent: "center",
    paddingLeft: 12,
    paddingVertical: 4,
  },
  rightWrap: {
    justifyContent: "center",
    paddingRight: 12,
    paddingVertical: 4,
  },
  actionBtn: {
    width: 72,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editBtn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
  },
  deleteBtn: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.border,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
});
