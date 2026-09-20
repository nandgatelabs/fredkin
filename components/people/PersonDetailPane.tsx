import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ConfirmModal";
import { RecordDetailModal } from "@/components/RecordDetailModal";
import { RecordRow } from "@/components/RecordRow";
import { getPerson } from "@/db/people";
import { deleteRecord, listRecordsForPerson, type RecordListItem } from "@/db/records";
import type { Person } from "@/db/types";
import { useKeydown } from "@/hooks/useKeydown";
import { formatMoney } from "@/lib/money";
import { summarizePersonRecords } from "@/lib/personRole";
import { groupRecordsByDate } from "@/lib/recordsUi";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  id: string;
  onClose: () => void;
  /** When true, skip safe-area padding (embedded in a desktop pane). */
  embedded?: boolean;
};

export function PersonDetailPane({ id, onClose, embedded = false }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [person, setPerson] = useState<Person | null>(null);
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecordListItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecordListItem | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPerson(id);
      if (!p) throw new Error("Person not found");
      setPerson(p);
      setRecords(await listRecordsForPerson(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load person");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          if (selected) setSelected(null);
          else onClose();
        }
      },
      [onClose, selected],
    ),
  );

  const summary = useMemo(() => summarizePersonRecords(records), [records]);

  const attributed = useMemo(
    () => records.filter((r) => !r.person_role || r.person_role === "with" || r.person_role === "gift"),
    [records],
  );
  const claims = useMemo(
    () => records.filter((r) => r.person_role === "they_owe" || r.person_role === "you_owe" || r.person_role === "settled"),
    [records],
  );

  const attributedSections = useMemo(() => groupRecordsByDate(attributed), [attributed]);
  const claimSections = useMemo(() => groupRecordsByDate(claims), [claims]);

  return (
    <View
      style={[
        styles.screen,
        embedded
          ? styles.embedded
          : { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onClose}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
        <Text style={styles.title}>Person</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !person ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : person ? (
        <SectionList
          sections={[
            ...claimSections.map((s) => ({ ...s, key: `c-${s.key}`, title: `Open claims · ${s.title}` })),
            ...attributedSections.map((s) => ({ ...s, key: `a-${s.key}`, title: `With / gift · ${s.title}` })),
          ]}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.summary}>
              <Text style={styles.name}>{person.name}</Text>
              {person.note ? <Text style={styles.note}>{person.note}</Text> : null}
              <Text style={styles.stat}>
                They owe: {formatMoney(Math.max(0, summary.theyOwe), { sign: "never" })}
              </Text>
              <Text style={styles.stat}>
                You owe: {formatMoney(Math.max(0, summary.youOwe), { sign: "never" })}
              </Text>
              <Text style={styles.stat}>
                Spent on them: {formatMoney(summary.spentOn, { sign: "never" })}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No events tagged with this person yet.</Text>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.section}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <RecordRow
              item={item}
              onPress={() => setSelected(item)}
              onEdit={() => router.push(`/record/new?id=${item.id}` as never)}
              onDelete={() => setPendingDelete(item)}
            />
          )}
        />
      ) : null}

      <RecordDetailModal
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={(r) => {
          setSelected(null);
          router.push(`/record/new?id=${r.id}` as never);
        }}
        onDelete={(r) => {
          setSelected(null);
          setPendingDelete(r);
        }}
      />
      <ConfirmModal
        visible={pendingDelete != null}
        title="Delete event?"
        message="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteRecord(pendingDelete.id).then(() => {
            setPendingDelete(null);
            return reload();
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  embedded: { paddingTop: 4, paddingBottom: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  title: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  error: { color: colors.expense, padding: 16 },
  list: { paddingBottom: 24 },
  summary: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  name: { color: colors.text, fontSize: 22, fontWeight: "700" },
  note: { color: colors.textSecondary, fontSize: 14 },
  stat: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  section: {
    color: colors.accentMuted,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: "uppercase",
  },
  empty: { color: colors.textSecondary, padding: 16 },
});
