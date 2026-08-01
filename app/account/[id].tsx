import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordDetailModal } from "@/components/RecordDetailModal";
import { RecordRow } from "@/components/RecordRow";
import {
  getAccount,
  getAccountPeriodStats,
  type AccountPeriodStats,
} from "@/db/accountDetails";
import { computeAccountBalance } from "@/db/accounts";
import {
  deleteRecord,
  listRecordsForAccount,
  type RecordListItem,
} from "@/db/records";
import type { Account } from "@/db/types";
import { useKeydown } from "@/hooks/useKeydown";
import { accountIcon } from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import { formatPeriodLabel, rangeForViewMode } from "@/lib/period";
import { groupRecordsByDate } from "@/lib/recordsUi";
import { webClickable, webFocusableProps } from "@/lib/web";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Scope = "period" | "all";

export default function AccountDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const shiftPeriod = usePeriodStore((s) => s.shiftPeriod);
  const viewMode = useSettingsStore((s) => s.viewMode);

  const [scope, setScope] = useState<Scope>("all");
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<AccountPeriodStats | null>(null);
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecordListItem | null>(null);

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
      const acc = await getAccount(id);
      if (!acc) throw new Error("Account not found");
      setAccount(acc);
      const bal = await computeAccountBalance(acc.id, acc.opening_balance);
      setBalance(bal);

      if (scope === "period") {
        const [periodStats, list] = await Promise.all([
          getAccountPeriodStats(acc.id, acc.opening_balance, range.start, range.end),
          listRecordsForAccount(acc.id, range),
        ]);
        setStats(periodStats);
        setRecords(list);
      } else {
        setStats(null);
        setRecords(await listRecordsForAccount(acc.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [id, range.end, range.start, scope]);

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
          else router.back();
        }
      },
      [router, selected],
    ),
  );

  const sections = useMemo(() => groupRecordsByDate(records), [records]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Account details</Text>
          <Text style={styles.subtitle}>
            {scope === "period" ? `Time selected: ${periodLabel}` : "Records: All time"}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.scopeRow}>
        {(["period", "all"] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setScope(s)}
            style={[styles.scopeChip, webClickable, scope === s && styles.scopeOn]}
            {...webFocusableProps}
          >
            <Text style={[styles.scopeText, scope === s && styles.scopeTextOn]}>
              {s === "period" ? "Period" : "All time"}
            </Text>
          </Pressable>
        ))}
        {scope === "period" ? (
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
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !account ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : account ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.identity}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={accountIcon(account.icon_key)}
                    size={26}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.balanceLine}>
                    Account balance:{" "}
                    <Text
                      style={{
                        color: balance >= 0 ? colors.income : colors.expense,
                        fontWeight: "700",
                      }}
                    >
                      {formatMoney(balance, { sign: "auto" })}
                    </Text>
                  </Text>
                  {scope === "all" ? (
                    <Text style={styles.initialLine}>
                      Initially: {formatMoney(account.opening_balance, { sign: "never" })}
                    </Text>
                  ) : null}
                </View>
              </View>

              {scope === "period" && stats ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{periodLabel}</Text>
                  <StatRow
                    label="Starting balance"
                    value={stats.startingBalance}
                    tone={stats.startingBalance >= 0 ? "income" : "expense"}
                  />
                  <View style={styles.split}>
                    <View style={styles.splitCol}>
                      <Text style={[styles.splitLabel, { color: colors.expense }]}>
                        Expense {formatMoney(-stats.expense, { sign: "auto" })}
                      </Text>
                      <Text style={styles.bigPct}>{stats.expensePercent.toFixed(2)}%</Text>
                      <Text style={styles.pctHint}>of total expense in this period</Text>
                    </View>
                    <View style={styles.splitCol}>
                      <Text style={[styles.splitLabel, { color: colors.income }]}>
                        Income {formatMoney(stats.income, { sign: "never" })}
                      </Text>
                      <Text style={styles.bigPct}>{stats.incomePercent.toFixed(2)}%</Text>
                      <Text style={styles.pctHint}>of total income in this period</Text>
                    </View>
                  </View>
                  <StatRow
                    label="Transfer into this account"
                    value={stats.transferIn}
                    tone="transfer"
                    signed={false}
                  />
                  <StatRow
                    label="Transfer out to other accounts"
                    value={-stats.transferOut}
                    tone="transfer"
                  />
                  <StatRow
                    label="Ending balance"
                    value={stats.endingBalance}
                    tone={stats.endingBalance >= 0 ? "income" : "expense"}
                  />
                </View>
              ) : (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.infoText}>
                    You can see monthly, weekly, or daily statistics of this account in
                    the Analysis section — or switch to Period above.
                  </Text>
                </View>
              )}

              <View style={styles.listMeta}>
                <Text style={styles.listMetaText}>
                  {scope === "period"
                    ? `${periodLabel} : ${records.length} record${records.length === 1 ? "" : "s"}`
                    : `Total ${records.length} records in this account`}
                </Text>
                <Text style={styles.sortLabel}>NEW TO OLD</Text>
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <RecordRow item={item} onPress={() => setSelected(item)} />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No records in this scope</Text>
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
          void deleteRecord(record.id).then(() => {
            setSelected(null);
            void reload();
          });
        }}
      />
    </View>
  );
}

function StatRow({
  label,
  value,
  tone,
  signed = true,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "transfer";
  signed?: boolean;
}) {
  const color =
    tone === "transfer"
      ? colors.transfer
      : tone === "income"
        ? colors.income
        : colors.expense;
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>
        {formatMoney(value, { sign: signed ? "auto" : "never" })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  close: { color: colors.accent, fontSize: 20, fontWeight: "600", width: 28 },
  headerText: { flex: 1, alignItems: "center" },
  title: { color: colors.accent, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  scopeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scopeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scopeOn: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.12)",
  },
  scopeText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  scopeTextOn: { color: colors.accent },
  periodNav: { flexDirection: "row", marginLeft: "auto", gap: 4 },
  error: { color: colors.danger, paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  listHeader: { gap: 14, marginBottom: 8 },
  identity: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: { color: colors.accent, fontSize: 20, fontWeight: "700" },
  balanceLine: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  initialLine: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: colors.accent,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  split: { flexDirection: "row", gap: 12 },
  splitCol: { flex: 1, gap: 4 },
  splitLabel: { fontSize: 13, fontWeight: "600" },
  bigPct: { color: colors.text, fontSize: 22, fontWeight: "700" },
  pctHint: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statLabel: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  statValue: { fontSize: 13, fontWeight: "700" },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
  },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  listMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
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
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
});
