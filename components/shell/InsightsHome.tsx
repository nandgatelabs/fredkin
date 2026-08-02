import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { PeriodHeader } from "@/components/PeriodHeader";
import { InsightsPane } from "@/components/insights/InsightsPane";
import { getCarryOverBefore, getPeriodTotals } from "@/db/records";
import { rangeForViewMode } from "@/lib/period";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

/** Full-width Insights (native tab / web full-screen mode). */
export function InsightsHome() {
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const carryOver = useSettingsStore((s) => s.carryOver);

  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [carryAmount, setCarryAmount] = useState(0);
  const [displayOpen, setDisplayOpen] = useState(false);

  const range = useMemo(
    () => rangeForViewMode(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  const reloadSummary = useCallback(async () => {
    try {
      const [totals, carry] = await Promise.all([
        getPeriodTotals(range.start, range.end),
        carryOver ? getCarryOverBefore(range.start) : Promise.resolve(0),
      ]);
      setExpense(totals.expense);
      setIncome(totals.income);
      setCarryAmount(carry);
    } catch {
      /* InsightsPane surfaces load errors */
    }
  }, [carryOver, range.end, range.start]);

  useFocusEffect(
    useCallback(() => {
      void reloadSummary();
    }, [reloadSummary]),
  );

  return (
    <View style={styles.root}>
      <GlassAtmosphere />
      <AppHeader />
      <PeriodHeader
        expense={expense}
        income={income}
        carryAmount={carryAmount}
        onFilterPress={() => setDisplayOpen(true)}
      />
      <InsightsPane />
      <DisplayOptionsModal
        visible={displayOpen}
        onClose={() => {
          setDisplayOpen(false);
          void reloadSummary();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
