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
      <Ionicons name="add" size={32} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.fab,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentMuted,
    zIndex: 20,
    elevation: Platform.OS === "android" ? 4 : 0,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
    borderColor: colors.accent,
    backgroundColor: "#45433C",
  },
});
