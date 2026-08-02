import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { WalletsPane } from "@/components/wallets/WalletsPane";
import { colors } from "@/theme";

/** Native: Wallets tab. Web: see accounts.web.tsx. */
export default function AccountsScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <GlassAtmosphere />
      <AppHeader />
      <WalletsPane
        onOpenAccount={(id) => router.push(`/account/${id}` as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
