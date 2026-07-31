import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

export function Fab() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add record"
      onPress={() => router.push("/record/new")}
      style={({ pressed }) => [
        styles.fab,
        webClickable,
        pressed && styles.fabPressed,
      ]}
    >
      <Ionicons name="add" size={30} color={colors.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    zIndex: 20,
    elevation: Platform.OS === "android" ? 6 : 0,
  },
  fabPressed: {
    backgroundColor: colors.accentPressed,
    transform: [{ scale: 0.96 }],
  },
});
