import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import { webClickable, webFocusableProps } from "@/lib/web";

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
  const c = useThemeColors();
  const isDisabled = disabled || busy;

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: c.accent, borderColor: c.accent }
      : variant === "secondary"
        ? { backgroundColor: "transparent", borderColor: c.accent }
        : variant === "danger"
          ? { backgroundColor: c.dangerMuted, borderColor: c.danger }
          : { backgroundColor: c.surfaceElevated, borderColor: c.border };

  const labelColor =
    variant === "primary"
      ? c.onAccent
      : variant === "secondary"
        ? c.accent
        : variant === "danger"
          ? c.danger
          : c.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!busy }}
      disabled={isDisabled}
      onPress={onPress}
      {...webFocusableProps}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        webClickable,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
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
