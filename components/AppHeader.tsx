import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors } from "@/theme";

type Props = {
  onMenuPress?: () => void;
};

export function AppHeader({ onMenuPress }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        onPress={onMenuPress}
        hitSlop={12}
        style={styles.iconBtn}
      >
        <Ionicons name="menu" size={24} color={colors.accent} />
      </Pressable>

      <Text style={styles.logo}>money-money</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search records"
        onPress={() => router.push("/search")}
        hitSlop={12}
        style={styles.iconBtn}
      >
        <Ionicons name="search" size={22} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
});
