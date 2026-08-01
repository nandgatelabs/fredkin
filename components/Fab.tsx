import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useThemeColors } from "@/hooks/useThemeColors";
import { webClickable, webFocusableProps } from "@/lib/web";

export function Fab() {
  const router = useRouter();
  const c = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add record"
      accessibilityHint="Shortcut: N"
      onPress={() => router.push("/record/new")}
      {...webFocusableProps}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: pressed ? c.accentPressed : c.accent,
        },
        webClickable,
        pressed && styles.fabPressed,
      ]}
    >
      <Ionicons name="add" size={30} color={c.onAccent} />
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    zIndex: 20,
    elevation: Platform.OS === "android" ? 6 : 0,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
  },
});
