import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function GhostButton({ label, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        webClickable,
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  btnPressed: {
    opacity: 0.85,
    backgroundColor: "rgba(229, 211, 138, 0.08)",
  },
  label: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
