import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyTab } from "@/components/EmptyTab";
import { Fab } from "@/components/Fab";
import { PeriodHeader } from "@/components/PeriodHeader";
import { colors } from "@/theme";

export default function RecordsScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <PeriodHeader expense={0} income={0} />
      <EmptyTab
        title="No records yet"
        subtitle="Tap + to add your first expense, income, or transfer. Import comes in a later slice."
      />
      <Fab />
      <Text style={styles.hint}>P0 shell · SQLite ready</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hint: {
    position: "absolute",
    left: 16,
    bottom: 24,
    color: colors.tabInactive,
    fontSize: 11,
  },
});
