import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  label: string;
  description?: string;
  valueText?: string;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitch?: (value: boolean) => void;
  disabled?: boolean;
};

export function PreferenceRow({
  label,
  description,
  valueText,
  onPress,
  switchValue,
  onSwitch,
  disabled,
}: Props) {
  const interactive = !!onPress && !disabled;
  const body = (
    <>
      <View style={styles.textCol}>
        <Text style={[styles.label, disabled && styles.dim]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, disabled && styles.dim]}>
            {description}
          </Text>
        ) : null}
        {valueText ? (
          <Text style={[styles.value, disabled && styles.dim]}>{valueText}</Text>
        ) : null}
      </View>
      {onSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitch}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.accentPressed }}
          thumbColor={switchValue ? colors.accent : colors.textSecondary}
        />
      ) : interactive ? (
        <Ionicons name="chevron-forward" size={18} color={colors.accentMuted} />
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled}
        {...webFocusableProps}
        style={({ pressed }) => [
          styles.row,
          webClickable,
          pressed && styles.pressed,
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.row}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: { opacity: 0.85 },
  textCol: { flex: 1, gap: 4 },
  label: { color: colors.text, fontSize: 16, fontWeight: "600" },
  description: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  value: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  dim: { opacity: 0.55 },
});
