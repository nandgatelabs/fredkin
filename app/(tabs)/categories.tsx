import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { CategoriesPane } from "@/components/categories/CategoriesPane";
import { colors } from "@/theme";

/** Native: Event Type tab. Web: see categories.web.tsx. */
export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <GlassAtmosphere />
      <AppHeader />
      <CategoriesPane
        onOpenCategory={(id) => router.push(`/category/${id}` as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
