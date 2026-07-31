import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme";

export default function NewRecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.action}>✕ CANCEL</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.action}>✓ SAVE</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Add record</Text>
        <Text style={styles.subtitle}>
          Composer with calculator keypad ships in P2. Shell navigation is wired.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  action: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 10,
    paddingBottom: 80,
  },
  title: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
