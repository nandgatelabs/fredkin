import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { deleteOccasion, getOccasion } from "@/db/occasions";
import { listRecordsForOccasion, type RecordListItem } from "@/db/records";
import type { Occasion } from "@/db/types";
import { useKeydown } from "@/hooks/useKeydown";
import { formatComposerDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { occasionSpendTotals } from "@/lib/occasionsUi";
import { parseOccurredAt } from "@/lib/recordsUi";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  occasionId: string | null;
  onClose: () => void;
  onAddEvent: (occasion: Occasion) => void;
  onGroupExisting: (occasion: Occasion) => void;
  onRename: (occasion: Occasion) => void;
  onChanged: () => void;
};

export function OccasionDetailModal({
  occasionId,
  onClose,
  onAddEvent,
  onGroupExisting,
  onRename,
  onChanged,
}: Props) {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [members, setMembers] = useState<RecordListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [backdropArmed, setBackdropArmed] = useState(false);

  const reload = useCallback(async () => {
    if (!occasionId) return;
    const [occ, list] = await Promise.all([
      getOccasion(occasionId),
      listRecordsForOccasion(occasionId),
    ]);
    setOccasion(occ);
    setMembers(list);
  }, [occasionId]);

  useEffect(() => {
    if (!occasionId) {
      setOccasion(null);
      setMembers([]);
      setBackdropArmed(false);
      return;
    }
    setBackdropArmed(false);
    const arm = setTimeout(() => setBackdropArmed(true), 400);
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
    return () => clearTimeout(arm);
  }, [occasionId, reload]);

  useKeydown(
    occasionId != null,
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

  if (!occasionId) return null;

  const totals = occasionSpendTotals(members);
  const when = occasion ? parseOccurredAt(occasion.occurred_at) : null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setBackdropArmed(true)}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (backdropArmed) onClose();
        }}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10} style={webClickable}>
              <Ionicons name="close" size={22} color={colors.onAccent} />
            </Pressable>
            <Text style={styles.kicker}>OCCASION</Text>
            <Text style={styles.title}>{occasion?.title ?? "…"}</Text>
            {when ? (
              <Text style={styles.when}>{formatComposerDate(when)}</Text>
            ) : null}
          </View>
          <ScrollView contentContainerStyle={styles.bodyInner}>
            <View style={styles.totalsRow}>
              <Text style={styles.summary}>
                {members.length} event{members.length === 1 ? "" : "s"}
              </Text>
              {totals.expense > 0 ? (
                <Text style={[styles.amount, { color: colors.expense }]}>
                  {formatMoney(totals.expense, { sign: "never" })}
                </Text>
              ) : null}
              {totals.income > 0 ? (
                <Text style={[styles.amount, { color: colors.income }]}>
                  {formatMoney(totals.income, { sign: "never" })}
                </Text>
              ) : null}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {members.map((m) => (
              <Text key={m.id} style={styles.member} numberOfLines={1}>
                {m.category_name ?? m.type} · {formatMoney(m.amount, { sign: "never" })}
              </Text>
            ))}
            <Button
              label="ADD EVENT"
              variant="primary"
              disabled={!occasion}
              onPress={() => {
                if (!occasion) return;
                onClose();
                onAddEvent(occasion);
              }}
            />
            <Button
              label="GROUP EXISTING EVENTS"
              variant="secondary"
              disabled={!occasion}
              onPress={() => {
                if (!occasion) return;
                onClose();
                onGroupExisting(occasion);
              }}
            />
            <Button
              label="RENAME"
              variant="ghost"
              disabled={!occasion}
              onPress={() => occasion && onRename(occasion)}
            />
            <Button
              label="DELETE OCCASION"
              variant="danger"
              disabled={!occasion}
              onPress={() => setConfirmDelete(true)}
            />
            <Text style={styles.hint}>
              Delete unlinks the events. They stay in the ledger.
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
      <ConfirmModal
        visible={confirmDelete}
        title="Delete occasion?"
        message="Events stay. Only the folder is removed."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!occasion) return;
          setConfirmDelete(false);
          void deleteOccasion(occasion.id)
            .then(() => {
              onChanged();
              onClose();
            })
            .catch((e) => setError(e instanceof Error ? e.message : "Delete failed"));
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.dialog,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: layout.dialogMaxWidth,
    width: "100%",
    alignSelf: "center",
    maxHeight: "85%",
  },
  header: {
    backgroundColor: colors.accent,
    padding: 16,
    gap: 4,
  },
  kicker: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.85,
  },
  title: { color: colors.onAccent, fontSize: 22, fontWeight: "700" },
  when: { color: colors.onAccent, opacity: 0.9, marginTop: 2 },
  bodyInner: { padding: 16, gap: 10 },
  summary: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  totalsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  amount: { fontSize: 15, fontWeight: "700" },
  member: { color: colors.text, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13 },
  hint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
});
