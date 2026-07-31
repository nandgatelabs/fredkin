import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyTab } from "@/components/EmptyTab";
import { Fab } from "@/components/Fab";
import { colors } from "@/theme";

export default function AccountsScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <EmptyTab
        title="Accounts"
        subtitle="Create wallets and cards in P1."
      />
      <Fab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
