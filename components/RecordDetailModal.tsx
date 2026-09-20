import { useCallback, type ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { RecordListItem } from "@/db/records";
import { useKeydown } from "@/hooks/useKeydown";
import { useThemeColors } from "@/hooks/useThemeColors";
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
import { isAdjustmentFlag, personRoleLabel } from "@/lib/personRole";
import { parseOccurredAt, signedDisplayAmount } from "@/lib/recordsUi";
import { webClickable } from "@/lib/web";
import { layout } from "@/theme/layout";

type Props = {
  record: RecordListItem | null;
  onClose: () => void;
  onEdit: (record: RecordListItem) => void;
  onDelete: (record: RecordListItem) => void;
  onAddToOccasion?: (record: RecordListItem) => void;
  onRemoveFromOccasion?: (record: RecordListItem) => void;
};

export function RecordDetailModal({
  record,
  onClose,
  onEdit,
  onDelete,
  onAddToOccasion,
  onRemoveFromOccasion,
}: Props) {
  const c = useThemeColors();

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

  const amount = signedDisplayAmount(record);
  const when = parseOccurredAt(record.occurred_at);
  const amountLabel =
    record.type === "transfer" && !isAdjustmentFlag(record.is_adjustment)
      ? formatMoney(record.amount, { sign: "never" })
      : formatMoney(amount, { sign: "auto" });
  const adj = isAdjustmentFlag(record.is_adjustment);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: c.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.card, { borderColor: c.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { backgroundColor: c.accent }]}>
            <View style={styles.headerActions}>
              <Pressable onPress={onClose} hitSlop={10} style={webClickable}>
                <Ionicons name="close" size={22} color={c.onAccent} />
              </Pressable>
              <View style={styles.headerRight}>
                <Pressable
                  onPress={() => onDelete(record)}
                  hitSlop={10}
                  style={webClickable}
                >
                  <Ionicons name="trash-outline" size={20} color={c.onAccent} />
                </Pressable>
                {adj ? null : (
                  <Pressable
                    onPress={() => onEdit(record)}
                    hitSlop={10}
                    style={webClickable}
                  >
                    <Ionicons name="pencil" size={20} color={c.onAccent} />
                  </Pressable>
                )}
              </View>
            </View>
            <Text style={[styles.type, { color: c.onAccent }]}>
              {adj ? "ADJUSTMENT" : record.type.toUpperCase()}
            </Text>
            <Text style={[styles.amount, { color: c.onAccent }]}>{amountLabel}</Text>
            <Text style={[styles.when, { color: c.onAccent, opacity: 0.9 }]}>
              {formatComposerDate(when)} {formatComposerTime(when)}
            </Text>
          </View>

          <View style={[styles.body, { backgroundColor: c.dialog }]}>
            {record.type === "transfer" && !adj ? (
              <>
                <DetailRow
                  label="From"
                  icon={accountIcon(record.account_icon_key)}
                  value={record.account_name}
                  accent={c.accent}
                  accentMuted={c.accentMuted}
                  border={c.border}
                />
                <DetailRow
                  label="To"
                  icon={accountIcon(record.account_icon_key)}
                  value={record.to_account_name ?? "—"}
                  accent={c.accent}
                  accentMuted={c.accentMuted}
                  border={c.border}
                />
              </>
            ) : (
              <>
                <DetailRow
                  label="Wallet"
                  icon={accountIcon(record.account_icon_key)}
                  value={record.account_name}
                  accent={c.accent}
                  accentMuted={c.accentMuted}
                  border={c.border}
                />
                <DetailRow
                  label="Event type"
                  icon={categoryIcon(record.category_icon_key ?? "pricetag")}
                  iconBg={
                    record.category_color ??
                    categoryColor(record.category_icon_key ?? "pricetag")
                  }
                  value={adj ? "Wallet check" : (record.category_name ?? "Uncategorized")}
                  accent={c.accent}
                  accentMuted={c.accentMuted}
                  border={c.border}
                />
              </>
            )}
            {record.note.trim() ? (
              <Text style={[styles.note, { color: c.textSecondary }]}>
                {record.note.trim()}
              </Text>
            ) : null}
            {record.person_name ? (
              <DetailRow
                label="Person"
                icon="person-outline"
                value={`${record.person_name}${
                  record.person_role ? ` · ${personRoleLabel(record.person_role)}` : ""
                }`}
                accent={c.accent}
                accentMuted={c.accentMuted}
                border={c.border}
              />
            ) : null}
            {record.occasion_title ? (
              <DetailRow
                label="Occasion"
                icon="albums-outline"
                value={record.occasion_title}
                accent={c.accent}
                accentMuted={c.accentMuted}
                border={c.border}
              />
            ) : null}
            {adj ? null : onAddToOccasion ? (
              <Pressable
                onPress={() => onAddToOccasion(record)}
                style={[styles.linkBtn, webClickable]}
              >
                <Text style={[styles.linkText, { color: c.accent }]}>
                  {record.occasion_id ? "Move to another occasion" : "Group into occasion"}
                </Text>
              </Pressable>
            ) : null}
            {record.occasion_id && onRemoveFromOccasion ? (
              <Pressable
                onPress={() => onRemoveFromOccasion(record)}
                style={[styles.linkBtn, webClickable]}
              >
                <Text style={[styles.linkText, { color: c.accentMuted }]}>
                  Remove from occasion
                </Text>
              </Pressable>
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
  accent,
  accentMuted,
  border,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  value: string;
  iconBg?: string;
  accent: string;
  accentMuted: string;
  border: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: accentMuted }]}>{label}</Text>
      <View style={[styles.pill, { borderColor: border }]}>
        <View style={[styles.pillIcon, iconBg ? { backgroundColor: iconBg } : null]}>
          <Ionicons name={icon} size={14} color={iconBg ? "#fff" : accent} />
        </View>
        <Text style={[styles.pillText, { color: accent }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
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
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 1,
    fontSize: 13,
  },
  amount: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 6,
  },
  when: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 13,
  },
  body: {
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
    fontSize: 14,
    fontWeight: "600",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
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
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  linkBtn: { paddingVertical: 4 },
  linkText: { fontSize: 14, fontWeight: "600" },
});
