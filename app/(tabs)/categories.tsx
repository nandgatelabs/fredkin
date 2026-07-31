import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyTab } from "@/components/EmptyTab";
import { Fab } from "@/components/Fab";
import { colors } from "@/theme";

export default function CategoriesScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <EmptyTab
        title="Categories"
        subtitle="Income and expense categories arrive in P1."
      />
      <Fab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
