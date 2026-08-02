import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { EmptyTab } from "@/components/EmptyTab";
import { PeriodHeader } from "@/components/PeriodHeader";
import { RecordDetailModal } from "@/components/RecordDetailModal";
import { RecordRow } from "@/components/RecordRow";
import {
  deleteRecord,
  getCarryOverBefore,
  getPeriodTotals,
  listRecordsInRange,
  type RecordListItem,
} from "@/db/records";
import { rangeForViewMode } from "@/lib/period";
import { groupRecordsByDate } from "@/lib/recordsUi";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  /** Extra bottom padding (e.g. native tab bar clearance). */
  listBottomPad?: number;
};

/** Events list + period strip (no app header / atmosphere). */
export function EventsPane({ listBottomPad = 24 }: Props) {
  const router = useRouter();
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const carryOver = useSettingsStore((s) => s.carryOver);

  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [carryAmount, setCarryAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [selected, setSelected] = useState<RecordListItem | null>(null);

  const range = useMemo(
    () => rangeForViewMode(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, totals, carry] = await Promise.all([
        listRecordsInRange(range.start, range.end),
        getPeriodTotals(range.start, range.end),
        carryOver ? getCarryOverBefore(range.start) : Promise.resolve(0),
      ]);
      setRecords(list);
      setExpense(totals.expense);
      setIncome(totals.income);
      setCarryAmount(carry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [carryOver, range.end, range.start]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const sections = useMemo(() => groupRecordsByDate(records), [records]);

  return (
    <View style={styles.root}>
      <PeriodHeader
        expense={expense}
        income={income}
        carryAmount={carryAmount}
        onFilterPress={() => setDisplayOpen(true)}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && records.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : records.length === 0 ? (
        <EmptyTab
          title="No events yet"
          subtitle="Tap + to add your first spend, income, or transfer for this period."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>
          )}
          renderItem={({ item }) => (
            <RecordRow item={item} onPress={() => setSelected(item)} />
          )}
        />
      )}

      <DisplayOptionsModal
        visible={displayOpen}
        onClose={() => {
          setDisplayOpen(false);
          void reload();
        }}
      />

      <RecordDetailModal
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={(record) => {
          setSelected(null);
          router.push({ pathname: "/record/new", params: { id: record.id } });
        }}
        onDelete={(record) => {
          void (async () => {
            const ok =
              Platform.OS === "web"
                ? window.confirm("Delete this record?")
                : await new Promise<boolean>((resolve) => {
                    Alert.alert("Delete record?", "This cannot be undone.", [
                      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => resolve(true),
                      },
                    ]);
                  });
            if (!ok) return;
            try {
              await deleteRecord(record.id);
              setSelected(null);
              await reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Delete failed");
            }
          })();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: {},
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
});
