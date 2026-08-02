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
import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { EmptyTab } from "@/components/EmptyTab";
import {
  getAccountPeriodBreakdown,
  getCategoryBreakdown,
  getDailyTotals,
  type AccountPeriodSlice,
  type CategorySlice,
  type DayTotal,
} from "@/db/analysis";
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

export const MODE_LABELS: Record<AnalysisMode, string> = {
  expense_overview: "Expense by type",
  income_overview: "Income by type",
  expense_flow: "Expense timeline",
  income_flow: "Income timeline",
  account: "Wallet breakdown",
};

type Props = {
  /** Show display-options entry (native Insights has PeriodHeader filter instead). */
  showDisplayOptions?: boolean;
  contentBottomPad?: number;
  /** Expand Insights to full screen (web split). */
  onMaximize?: () => void;
};

/** Insights body: mode picker + charts (no app header / period strip). */
export function InsightsPane({
  showDisplayOptions = false,
  contentBottomPad = 40,
  onMaximize,
}: Props) {
  const router = useRouter();
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const viewMode = useSettingsStore((s) => s.viewMode);

  const [mode, setMode] = useState<AnalysisMode>("expense_overview");
  const [modeOpen, setModeOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);

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
  const flowCalendarOffsetRef = useRef(0);

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
  }, [mode, range.end, range.start]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const tone: "expense" | "income" =
    mode === "income_overview" || mode === "income_flow" ? "income" : "expense";

  const isEmpty =
    mode === "expense_overview" || mode === "income_overview"
      ? slices.length === 0
      : mode === "expense_flow" || mode === "income_flow"
        ? !days.some((d) => d.amount > 0)
        : accounts.length === 0;

  const emptyCopy =
    tone === "income"
      ? {
          title: "No income yet",
          subtitle: "Add income events for this period to see Insights.",
        }
      : mode === "account"
        ? {
            title: "No wallet activity",
            subtitle: "Add events for this period to see Insights.",
          }
        : {
            title: "No spend yet",
            subtitle: "Add events for this period to see Insights.",
          };

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
    setSelectedSlice(selectedSlice === index ? null : index);
  }

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setModeOpen(true)}
          style={[styles.modeBtn, webClickable]}
        >
          <Text style={styles.modeLabel}>{MODE_LABELS[mode]}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.accent} />
        </Pressable>
        {showDisplayOptions ? (
          <Pressable
            onPress={() => setDisplayOpen(true)}
            hitSlop={8}
            style={[styles.filterBtn, webClickable]}
            accessibilityLabel="Display options"
          >
            <Ionicons name="options-outline" size={20} color={colors.accent} />
          </Pressable>
        ) : null}
        {onMaximize ? (
          <Pressable
            onPress={onMaximize}
            hitSlop={8}
            style={[styles.filterBtn, webClickable]}
            accessibilityLabel="Expand Insights to full screen"
          >
            <Ionicons name="expand-outline" size={20} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : isEmpty ? (
        <EmptyTab title={emptyCopy.title} subtitle={emptyCopy.subtitle} />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingBottom: contentBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {(mode === "expense_overview" || mode === "income_overview") && (
            <>
              <DonutChart
                label={tone === "expense" ? "Spend" : "Income"}
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
              <View
                onLayout={(e) => {
                  flowCalendarOffsetRef.current = e.nativeEvent.layout.y;
                }}
              >
                <FlowCalendar
                  rangeStart={range.start}
                  rangeEnd={range.end}
                  days={days}
                  tone={tone}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onSelectedMonthLayout={(y) => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, flowCalendarOffsetRef.current + y - 16),
                      animated: true,
                    });
                  }}
                />
              </View>
            </>
          )}

          {mode === "account" && (
            <>
              <AccountBars
                accounts={accounts}
                selectedId={selectedAccount}
                onSelect={(id) => {
                  if (id) router.push(`/account/${id}` as never);
                  else setSelectedAccount(null);
                }}
              />
              <AccountPeriodList
                accounts={accounts}
                selectedId={selectedAccount}
                onSelect={(id) => {
                  if (id) router.push(`/account/${id}` as never);
                  else setSelectedAccount(null);
                }}
              />
            </>
          )}
        </ScrollView>
      )}

      <ActionMenu
        visible={modeOpen}
        title="Insights mode"
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
  root: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1,
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
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginTop: 8,
    fontSize: 13,
  },
});
