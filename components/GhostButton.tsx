import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors } from "@/theme";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function GhostButton({ label, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]}>
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
  },
  label: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
