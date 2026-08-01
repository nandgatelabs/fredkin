import { useCallback, type ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { RecordListItem } from "@/db/records";
import { useKeydown } from "@/hooks/useKeydown";
import {
  formatComposerDate,
  formatComposerTime,
} from "@/lib/datetime";
import {
  accountIcon,
  categoryColor,
  categoryIcon,
} from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import { parseOccurredAt, signedDisplayAmount } from "@/lib/recordsUi";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  record: RecordListItem | null;
  onClose: () => void;
  onEdit: (record: RecordListItem) => void;
  onDelete: (record: RecordListItem) => void;
};

export function RecordDetailModal({ record, onClose, onEdit, onDelete }: Props) {
  useKeydown(
    record != null,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      },
      [onClose],
    ),
  );

  if (!record) return null;

  const headerColor =
    record.type === "income"
      ? colors.income
      : record.type === "transfer"
        ? colors.transfer
        : "#E07A62";

  const amount = signedDisplayAmount(record);
  const when = parseOccurredAt(record.occurred_at);
  const amountLabel =
    record.type === "transfer"
      ? formatMoney(record.amount, { sign: "never" })
      : formatMoney(amount, { sign: "auto" });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { backgroundColor: headerColor }]}>
            <View style={styles.headerActions}>
              <Pressable onPress={onClose} hitSlop={10} style={webClickable}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
              <View style={styles.headerRight}>
                <Pressable
                  onPress={() => onDelete(record)}
                  hitSlop={10}
                  style={webClickable}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </Pressable>
                <Pressable
                  onPress={() => onEdit(record)}
                  hitSlop={10}
                  style={webClickable}
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
            <Text style={styles.type}>{record.type.toUpperCase()}</Text>
            <Text style={styles.amount}>{amountLabel}</Text>
            <Text style={styles.when}>
              {formatComposerDate(when)} {formatComposerTime(when)}
            </Text>
          </View>

          <View style={styles.body}>
            {record.type === "transfer" ? (
              <>
                <DetailRow
                  label="From"
                  icon={accountIcon(record.account_icon_key)}
                  value={record.account_name}
                />
                <DetailRow
                  label="To"
                  icon={accountIcon(record.account_icon_key)}
                  value={record.to_account_name ?? "—"}
                />
              </>
            ) : (
              <>
                <DetailRow
                  label="Wallet"
                  icon={accountIcon(record.account_icon_key)}
                  value={record.account_name}
                />
                <DetailRow
                  label="Event type"
                  icon={categoryIcon(record.category_icon_key ?? "pricetag")}
                  iconBg={
                    record.category_color ??
                    categoryColor(record.category_icon_key ?? "pricetag")
                  }
                  value={record.category_name ?? "Uncategorized"}
                />
              </>
            )}
            {record.note.trim() ? (
              <Text style={styles.note}>{record.note.trim()}</Text>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({
  label,
  icon,
  value,
  iconBg,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  value: string;
  iconBg?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.pill}>
        <View style={[styles.pillIcon, iconBg ? { backgroundColor: iconBg } : null]}>
          <Ionicons
            name={icon}
            size={14}
            color={iconBg ? "#fff" : colors.accent}
          />
        </View>
        <Text style={styles.pillText} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: "row",
    gap: 16,
  },
  type: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: 13,
  },
  amount: {
    color: "#fff",
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 6,
  },
  when: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 6,
    fontSize: 13,
  },
  body: {
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: {
    color: colors.accentMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: "70%",
  },
  pillIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
