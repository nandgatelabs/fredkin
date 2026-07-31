import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyTab } from "@/components/EmptyTab";
import { Fab } from "@/components/Fab";
import { PeriodHeader } from "@/components/PeriodHeader";
import { colors } from "@/theme";

export default function AnalysisScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <PeriodHeader expense={0} income={0} />
      <EmptyTab
        title="Analysis"
        subtitle="Charts and calendars land in P5 once records exist."
      />
      <Fab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
