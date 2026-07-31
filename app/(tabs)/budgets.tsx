import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { ActionMenu } from "@/components/ActionMenu";
import { AppHeader } from "@/components/AppHeader";
import { BudgetEditorModal } from "@/components/BudgetEditorModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Fab } from "@/components/Fab";
import { GhostButton } from "@/components/GhostButton";
import {
  copyBudgetsFromMonth,
  deleteBudget,
  getBudgetTotals,
  listBudgetsForMonth,
  listUnbudgetedExpenseCategories,
  setBudget,
  type BudgetRow,
} from "@/db/budgets";
import { categoryIcon } from "@/lib/icons";
import { formatMoney } from "@/lib/money";
import { analysisColor } from "@/lib/analysisPalette";
import { webClickable } from "@/lib/web";
import { usePeriodStore } from "@/store/period";
import { colors } from "@/theme";

function parseAnchor(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m };
}

function shiftMonthIso(iso: string, delta: number) {
  const d = new Date(parseAnchor(iso).year, parseAnchor(iso).month - 1 + delta, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function monthLabel(iso: string) {
  const { year, month } = parseAnchor(iso);
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[month - 1]} ${year}`;
}

type Unbudgeted = {
  id: string;
  name: string;
  icon_key: string;
  color: string | null;
};

export default function BudgetsScreen() {
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const setAnchorDate = usePeriodStore((s) => s.setAnchorDate);
  const { year, month } = useMemo(() => parseAnchor(anchorDate), [anchorDate]);

  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [unbudgeted, setUnbudgeted] = useState<Unbudgeted[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [menuBudget, setMenuBudget] = useState<BudgetRow | null>(null);
  const [editor, setEditor] = useState<
    | { mode: "create"; category: Unbudgeted }
    | { mode: "edit"; budget: BudgetRow }
    | null
  >(null);
  const [copyConfirm, setCopyConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<BudgetRow | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, open, totals] = await Promise.all([
        listBudgetsForMonth(year, month),
        listUnbudgetedExpenseCategories(year, month),
        getBudgetTotals(year, month),
      ]);
      setBudgets(list);
      setUnbudgeted(open);
      setTotalBudget(totals.totalBudget);
      setTotalSpent(totals.totalSpent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const now = new Date();
  const isPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);

  return (
    <View style={styles.screen}>
      <AppHeader />

      <View style={styles.periodRow}>
        <Pressable
          onPress={() => setAnchorDate(shiftMonthIso(anchorDate, -1))}
          hitSlop={10}
          style={[styles.chevron, webClickable]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
        </Pressable>
        <Text style={styles.periodLabel}>{monthLabel(anchorDate)}</Text>
        <Pressable
          onPress={() => setAnchorDate(shiftMonthIso(anchorDate, 1))}
          hitSlop={10}
          style={[styles.chevron, webClickable]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.totals}>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>TOTAL BUDGET</Text>
          <Text style={[styles.totalValue, { color: colors.accent }]}>
            {formatMoney(totalBudget, { sign: "never" })}
          </Text>
        </View>
        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>TOTAL SPENT</Text>
          <Text style={[styles.totalValue, { color: colors.expense }]}>
            {formatMoney(totalSpent, { sign: "never" })}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && budgets.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.section}>Budgeted categories</Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No budgets this month. Set one below, or copy from last month.
            </Text>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {unbudgeted.length > 0 ? (
                <>
                  <Text style={[styles.section, { marginTop: 20 }]}>
                    Not budgeted this month
                  </Text>
                  {unbudgeted.map((c, i) => (
                    <View key={c.id} style={styles.unbudgetedRow}>
                      <View
                        style={[
                          styles.icon,
                          { backgroundColor: c.color ?? analysisColor(i) },
                        ]}
                      >
                        <Ionicons
                          name={categoryIcon(c.icon_key)}
                          size={18}
                          color="#fff"
                        />
                      </View>
                      <Text style={styles.catName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <GhostButton
                        label="SET BUDGET"
                        onPress={() => setEditor({ mode: "create", category: c })}
                        style={styles.setBtn}
                      />
                    </View>
                  ))}
                </>
              ) : null}
              <GhostButton
                label="COPY FROM LAST MONTH"
                onPress={() => setCopyConfirm(true)}
                style={{ marginTop: 16 }}
              />
            </View>
          }
          renderItem={({ item, index }) => {
            const remaining = item.limit_amount - item.spent;
            const pct =
              item.limit_amount > 0
                ? Math.min(100, (item.spent / item.limit_amount) * 100)
                : item.spent > 0
                  ? 100
                  : 0;
            const exceeded = item.spent > item.limit_amount;
            const color = item.category_color ?? analysisColor(index);

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.icon, { backgroundColor: color }]}>
                    <Ionicons
                      name={categoryIcon(item.category_icon_key)}
                      size={18}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.catName}>{item.category_name}</Text>
                    <Text style={styles.meta}>
                      Limit {formatMoney(item.limit_amount, { sign: "never" })} · Spent{" "}
                      {formatMoney(item.spent, { sign: "never" })}
                    </Text>
                    <Text
                      style={[
                        styles.remaining,
                        { color: remaining >= 0 ? colors.income : colors.expense },
                      ]}
                    >
                      Remaining {formatMoney(remaining, { sign: "auto" })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setMenuBudget(item)}
                    hitSlop={10}
                    style={webClickable}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color={colors.accentMuted}
                    />
                  </Pressable>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: exceeded ? colors.danger : color,
                      },
                    ]}
                  />
                </View>
                {exceeded ? (
                  <Text style={styles.flag}>*Limit exceeded</Text>
                ) : isPastMonth ? (
                  <Text style={styles.flagMuted}>*Budget expired</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}

      <Fab />

      <ActionMenu
        visible={menuBudget != null}
        title={menuBudget?.category_name}
        onClose={() => setMenuBudget(null)}
        items={[
          {
            label: "Edit",
            onPress: () => {
              if (menuBudget) setEditor({ mode: "edit", budget: menuBudget });
            },
          },
          {
            label: "Delete",
            destructive: true,
            onPress: () => {
              if (menuBudget) setDeleteConfirm(menuBudget);
            },
          },
        ]}
      />

      <BudgetEditorModal
        visible={editor != null}
        categoryName={
          editor?.mode === "edit"
            ? editor.budget.category_name
            : (editor?.category.name ?? "")
        }
        initialLimit={
          editor?.mode === "edit" ? editor.budget.limit_amount : 0
        }
        onCancel={() => setEditor(null)}
        onSave={async (limit) => {
          if (!editor) return;
          if (editor.mode === "edit") {
            await setBudget(editor.budget.category_id, year, month, limit);
          } else {
            await setBudget(editor.category.id, year, month, limit);
          }
          setEditor(null);
          await reload();
        }}
      />

      <ConfirmModal
        visible={copyConfirm}
        title="Copy budgets?"
        message={`Copy every budget from the previous month into ${monthLabel(anchorDate)}? Existing limits for the same categories will be overwritten.`}
        confirmLabel="Copy"
        onCancel={() => setCopyConfirm(false)}
        onConfirm={() => {
          setCopyConfirm(false);
          const prev = parseAnchor(shiftMonthIso(anchorDate, -1));
          void copyBudgetsFromMonth(prev.year, prev.month, year, month)
            .then((n) => {
              if (n === 0) setError("No budgets found in the previous month");
              return reload();
            })
            .catch((e) =>
              setError(e instanceof Error ? e.message : "Copy failed"),
            );
        }}
      />

      <ConfirmModal
        visible={deleteConfirm != null}
        title="Delete budget?"
        message={
          deleteConfirm
            ? `Remove the budget for “${deleteConfirm.category_name}” this month?`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          const id = deleteConfirm.id;
          setDeleteConfirm(null);
          void deleteBudget(id)
            .then(reload)
            .catch((e) =>
              setError(e instanceof Error ? e.message : "Delete failed"),
            );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  chevron: { padding: 6 },
  periodLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 160,
    textAlign: "center",
  },
  totals: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  totalCol: { flex: 1, gap: 4 },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  totalValue: { fontSize: 18, fontWeight: "800" },
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 10 },
  section: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 2, minWidth: 0 },
  catName: { color: colors.accent, fontWeight: "600", fontSize: 15 },
  meta: { color: colors.textSecondary, fontSize: 12 },
  remaining: { fontSize: 13, fontWeight: "700" },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSubtle,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  flag: { color: colors.danger, fontSize: 12, fontWeight: "600" },
  flagMuted: { color: colors.textSecondary, fontSize: 12 },
  footer: { marginTop: 4 },
  unbudgetedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  setBtn: { minWidth: 110, minHeight: 36, paddingVertical: 8 },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
});
