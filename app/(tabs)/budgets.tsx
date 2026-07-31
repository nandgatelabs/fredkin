import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyTab } from "@/components/EmptyTab";
import { Fab } from "@/components/Fab";
import { PeriodHeader } from "@/components/PeriodHeader";
import { colors } from "@/theme";

export default function BudgetsScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <PeriodHeader showSummary={false} />
      <EmptyTab
        title="Budgets"
        subtitle="Set monthly category limits in P6."
      />
      <Fab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
