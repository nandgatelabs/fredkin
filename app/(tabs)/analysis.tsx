import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollView as ScrollViewType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { AccountBars, AccountPeriodList } from "@/components/analysis/AccountBars";
import { CategoryBreakdownList } from "@/components/analysis/CategoryBreakdownList";
import {
  DonutChart,
  DonutLegend,
  donutColor,
} from "@/components/analysis/DonutChart";
import { FlowCalendar } from "@/components/analysis/FlowCalendar";
import { FlowLineChart } from "@/components/analysis/FlowLineChart";
import { ActionMenu } from "@/components/ActionMenu";
import { AppHeader } from "@/components/AppHeader";
import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { Fab } from "@/components/Fab";
import { PeriodHeader } from "@/components/PeriodHeader";
import {
  getAccountPeriodBreakdown,
  getCategoryBreakdown,
  getDailyTotals,
  type AccountPeriodSlice,
  type CategorySlice,
  type DayTotal,
} from "@/db/analysis";
import { getCarryOverBefore, getPeriodTotals } from "@/db/records";
import { rangeForViewMode } from "@/lib/period";
import { webClickable } from "@/lib/web";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

export type AnalysisMode =
  | "expense_overview"
  | "income_overview"
  | "expense_flow"
  | "income_flow"
  | "account";

const MODE_LABELS: Record<AnalysisMode, string> = {
  expense_overview: "EXPENSE OVERVIEW",
  income_overview: "INCOME OVERVIEW",
  expense_flow: "EXPENSE FLOW",
  income_flow: "INCOME FLOW",
  account: "ACCOUNT ANALYSIS",
};

export default function AnalysisScreen() {
  const router = useRouter();
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const carryOver = useSettingsStore((s) => s.carryOver);

  const [mode, setMode] = useState<AnalysisMode>("expense_overview");
  const [modeOpen, setModeOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);

  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [carryAmount, setCarryAmount] = useState(0);
  const [slices, setSlices] = useState<CategorySlice[]>([]);
  const [days, setDays] = useState<DayTotal[]>([]);
  const [accounts, setAccounts] = useState<AccountPeriodSlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewType>(null);
  const listOffsetRef = useRef(0);

  const range = useMemo(
    () => rangeForViewMode(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  useEffect(() => {
    setSelectedSlice(null);
    setSelectedDay(null);
    setSelectedAccount(null);
  }, [mode, range.start, range.end]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [totals, carry] = await Promise.all([
        getPeriodTotals(range.start, range.end),
        carryOver ? getCarryOverBefore(range.start) : Promise.resolve(0),
      ]);
      setExpense(totals.expense);
      setIncome(totals.income);
      setCarryAmount(carry);

      if (mode === "expense_overview" || mode === "income_overview") {
        const type = mode === "expense_overview" ? "expense" : "income";
        setSlices(await getCategoryBreakdown(range.start, range.end, type));
        setDays([]);
        setAccounts([]);
      } else if (mode === "expense_flow" || mode === "income_flow") {
        const type = mode === "expense_flow" ? "expense" : "income";
        setDays(await getDailyTotals(range.start, range.end, type));
        setSlices([]);
        setAccounts([]);
      } else {
        setAccounts(await getAccountPeriodBreakdown(range.start, range.end));
        setSlices([]);
        setDays([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, [carryOver, mode, range.end, range.start]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const tone: "expense" | "income" =
    mode === "income_overview" || mode === "income_flow" ? "income" : "expense";

  const donutSegments = slices.map((s, i) => ({
    amount: s.amount,
    color: donutColor(i),
    name: s.name,
    percent: s.percent,
  }));

  function openCategoryOrSelect(index: number | null) {
    if (index == null) {
      setSelectedSlice(null);
      return;
    }
    const slice = slices[index];
    if (slice?.categoryId) {
      router.push(`/category/${slice.categoryId}` as never);
      return;
    }
    // Uncategorized (no id) — keep pie-share highlight only.
    setSelectedSlice(selectedSlice === index ? null : index);
  }

  return (
    <View style={styles.screen}>
      <AppHeader />
      <PeriodHeader
        expense={expense}
        income={income}
        carryAmount={carryAmount}
        onFilterPress={() => setDisplayOpen(true)}
      />

      <Pressable
        onPress={() => setModeOpen(true)}
        style={[styles.modeBtn, webClickable]}
      >
        <Text style={styles.modeLabel}>{MODE_LABELS[mode]}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.accent} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {(mode === "expense_overview" || mode === "income_overview") && (
            <>
              <DonutChart
                label={tone === "expense" ? "Expenses" : "Income"}
                tone={tone}
                segments={donutSegments}
                selectedIndex={selectedSlice}
                onSelect={openCategoryOrSelect}
              />
              <DonutLegend
                segments={donutSegments}
                selectedIndex={selectedSlice}
                onSelect={openCategoryOrSelect}
              />
              <View
                onLayout={(e) => {
                  listOffsetRef.current = e.nativeEvent.layout.y;
                }}
              >
                <CategoryBreakdownList
                  slices={slices}
                  tone={tone}
                  selectedIndex={selectedSlice}
                  onSelect={openCategoryOrSelect}
                  onOpenCategory={(categoryId) =>
                    router.push(`/category/${categoryId}` as never)
                  }
                  onSelectedLayout={(y) => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, listOffsetRef.current + y - 24),
                      animated: true,
                    });
                  }}
                />
              </View>
            </>
          )}

          {(mode === "expense_flow" || mode === "income_flow") && (
            <>
              <FlowLineChart
                days={days}
                rangeStart={range.start}
                rangeEnd={range.end}
                tone={tone}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              <FlowCalendar
                rangeStart={range.start}
                rangeEnd={range.end}
                days={days}
                tone={tone}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </>
          )}

          {mode === "account" && (
            <>
              <AccountBars
                accounts={accounts}
                selectedId={selectedAccount}
                onSelect={setSelectedAccount}
              />
              <AccountPeriodList
                accounts={accounts}
                selectedId={selectedAccount}
                onSelect={setSelectedAccount}
              />
            </>
          )}
        </ScrollView>
      )}

      <Fab />

      <ActionMenu
        visible={modeOpen}
        title="Analysis mode"
        onClose={() => setModeOpen(false)}
        items={(Object.keys(MODE_LABELS) as AnalysisMode[]).map((key) => ({
          label: MODE_LABELS[key],
          onPress: () => setMode(key),
        }))}
      />

      <DisplayOptionsModal
        visible={displayOpen}
        onClose={() => {
          setDisplayOpen(false);
          void reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  modeBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  modeLabel: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginTop: 8,
    fontSize: 13,
  },
});
