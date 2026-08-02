import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchBody } from "@/components/search/SearchBody";
import { colors } from "@/theme";

/** Native full-screen search. Web: see search.web.tsx (centered modal). */
export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <SearchBody onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
});
