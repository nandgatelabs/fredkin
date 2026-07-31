import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = "secondary",
  disabled,
  busy,
  style,
}: Props) {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        webClickable,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.onAccent : colors.accent}
          size="small"
        />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: "transparent",
    borderColor: colors.accent,
  },
  danger: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.onAccent },
  secondary: { color: colors.accent },
  danger: { color: colors.danger },
  ghost: { color: colors.text },
});
