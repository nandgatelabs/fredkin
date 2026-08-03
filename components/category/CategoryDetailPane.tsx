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
import { MiniShareDonut } from "@/components/MiniShareDonut";
import { RecordDetailModal } from "@/components/RecordDetailModal";
import { getCategory } from "@/db/categories";
import {
  getCategoryPeriodStats,
  type CategoryPeriodStats,
} from "@/db/categoryDetails";
import {
  deleteRecord,
  listRecordsForCategory,
  type RecordListItem,
} from "@/db/records";
import type { Category } from "@/db/types";
import { useKeydown } from "@/hooks/useKeydown";
import { categoryIcon } from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import { formatPeriodLabel, rangeForViewMode } from "@/lib/period";
import { groupRecordsByDate } from "@/lib/recordsUi";
import { webClickable, webFocusableProps } from "@/lib/web";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  id: string;
  onClose: () => void;
  /** When true, skip safe-area padding (embedded in a desktop pane). */
  embedded?: boolean;
};

export function CategoryDetailPane({ id, onClose, embedded = false }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const viewMode = useSettingsStore((s) => s.viewMode);

  const [category, setCategory] = useState<Category | null>(null);
  const [stats, setStats] = useState<CategoryPeriodStats | null>(null);
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecordListItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecordListItem | null>(null);

  const range = useMemo(
    () => rangeForViewMode(anchorDate, viewMode),
    [anchorDate, viewMode],
  );
  const periodLabel = formatPeriodLabel(anchorDate, viewMode);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const cat = await getCategory(id);
      if (!cat) throw new Error("Category not found");
      if (cat.type !== "expense" && cat.type !== "income") {
        throw new Error("Only expense/income categories have details");
      }
      setCategory(cat);
      const [periodStats, list] = await Promise.all([
        getCategoryPeriodStats(cat.id, cat.type, range.start, range.end),
        listRecordsForCategory(cat.id, range),
      ]);
      setStats(periodStats);
      setRecords(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load category");
    } finally {
      setLoading(false);
    }
  }, [id, range.end, range.start]);

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

  const sections = useMemo(() => groupRecordsByDate(records), [records]);
  const tone = category?.type === "income" ? "income" : "expense";
  const amountColor = tone === "income" ? colors.income : colors.expense;

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
        <View style={styles.headerText}>
          <Text style={styles.title}>Event type details</Text>
          <Text style={styles.subtitle}>Time selected: {periodLabel}</Text>
        </View>
        <View style={styles.periodNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous period"
            onPress={() => shiftPeriod(-1)}
            hitSlop={8}
            style={webClickable}
            {...webFocusableProps}
          >
            <Ionicons name="chevron-back" size={18} color={colors.accent} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next period"
            onPress={() => shiftPeriod(1)}
            hitSlop={8}
            style={webClickable}
            {...webFocusableProps}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !category ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : category && stats ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.identity}>
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: category.color ?? colors.border },
                  ]}
                >
                  <Ionicons
                    name={categoryIcon(category.icon_key)}
                    size={22}
                    color="#fff"
                  />
                </View>
                <View>
                  <Text style={styles.catName}>{category.name}</Text>
                  <Text style={styles.catType}>
                    {category.type === "income" ? "Income event type" : "Spend event type"}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>{periodLabel}</Text>
                <View style={styles.cardBody}>
                  <MiniShareDonut
                    percent={stats.percent}
                    color={category.color ?? colors.accent}
                  />
                  <View style={styles.pctCol}>
                    <Text style={styles.bigPct}>{stats.percent.toFixed(2)}%</Text>
                    <Text style={styles.pctHint}>
                      of total {tone === "expense" ? "spend" : tone} in this period
                    </Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.footerLabel}>
                    {category.type === "income" ? "Income" : "Spend"} in this period:{" "}
                    <Text style={{ color: amountColor, fontWeight: "700" }}>
                      {formatMoney(
                        category.type === "expense" ? -stats.amount : stats.amount,
                        { sign: "auto" },
                      )}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.listMeta}>
                <Text style={styles.listMetaText}>
                  {periodLabel} : {stats.recordCount} record
                  {stats.recordCount === 1 ? "" : "s"}
                </Text>
                <Text style={styles.sortLabel}>NEW TO OLD</Text>
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              style={({ pressed }) => [
                styles.row,
                webClickable,
                pressed && styles.rowPressed,
              ]}
              {...webFocusableProps}
            >
              <Text style={styles.bullet}>•</Text>
              <View style={styles.rowBody}>
                <Text style={styles.account}>{item.account_name}</Text>
                {item.note.trim() ? (
                  <Text style={styles.note} numberOfLines={1}>
                    “{item.note.trim()}”
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.amount, { color: amountColor }]}>
                {formatMoney(
                  category.type === "expense" ? -item.amount : item.amount,
                  { sign: "auto" },
                )}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No records in this period</Text>
            ) : null
          }
        />
      ) : null}

      <RecordDetailModal
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={(record) => {
          setSelected(null);
          router.push({ pathname: "/record/new", params: { id: record.id } });
        }}
        onDelete={(record) => {
          setSelected(null);
          setPendingDelete(record);
        }}
      />

      <ConfirmModal
        visible={pendingDelete != null}
        title="Delete record?"
        message="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          void (async () => {
            const record = pendingDelete;
            setPendingDelete(null);
            if (!record) return;
            await deleteRecord(record.id);
            void reload();
          })();
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
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerText: { flex: 1 },
  title: { color: colors.accent, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  periodNav: { flexDirection: "row", gap: 4, paddingTop: 2 },
  error: { color: colors.danger, paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  listHeader: { gap: 16, marginBottom: 4 },
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { color: colors.accent, fontSize: 22, fontWeight: "700" },
  catType: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    color: colors.accent,
    fontWeight: "700",
    textAlign: "center",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
  },
  pctCol: { flex: 1, gap: 4 },
  bigPct: { color: colors.text, fontSize: 28, fontWeight: "700" },
  pctHint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  footerLabel: { color: colors.textSecondary, fontSize: 14 },
  listMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listMetaText: { color: colors.textSecondary, fontSize: 13 },
  sortLabel: { color: colors.accentMuted, fontSize: 11, fontWeight: "700" },
  sectionTitle: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  rowPressed: { opacity: 0.85 },
  bullet: { color: colors.accentMuted, fontSize: 16, width: 12 },
  rowBody: { flex: 1, gap: 2 },
  account: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  note: { color: colors.textSecondary, fontSize: 13 },
  amount: { fontSize: 14, fontWeight: "700" },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
});
