import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColors } from "@/hooks/useThemeColors";
import { webClickable } from "@/lib/web";

type Props = {
  expression: string;
  onDigit: (d: string) => void;
  onDecimal: () => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onBackspace: () => void;
};

const KEYS: { label: string; kind: "digit" | "op" | "eq" | "dot" | "zero" }[][] = [
  [
    { label: "+", kind: "op" },
    { label: "1", kind: "digit" },
    { label: "2", kind: "digit" },
    { label: "3", kind: "digit" },
  ],
  [
    { label: "−", kind: "op" },
    { label: "4", kind: "digit" },
    { label: "5", kind: "digit" },
    { label: "6", kind: "digit" },
  ],
  [
    { label: "×", kind: "op" },
    { label: "7", kind: "digit" },
    { label: "8", kind: "digit" },
    { label: "9", kind: "digit" },
  ],
  [
    { label: "÷", kind: "op" },
    { label: "0", kind: "zero" },
    { label: ".", kind: "dot" },
    { label: "=", kind: "eq" },
  ],
];

export function CalculatorKeypad({
  expression,
  onDigit,
  onDecimal,
  onOperator,
  onEquals,
  onBackspace,
}: Props) {
  const c = useThemeColors();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.displayRow,
          { backgroundColor: c.inputBg, borderColor: c.borderSubtle },
        ]}
      >
        <Text
          style={[styles.display, { color: c.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {expression}
        </Text>
        <Pressable
          onPress={onBackspace}
          hitSlop={8}
          style={[styles.backspace, webClickable]}
        >
          <Ionicons name="backspace-outline" size={22} color={c.accent} />
        </Pressable>
      </View>

      <View style={[styles.grid, { borderColor: c.borderSubtle }]}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={[styles.row, { borderColor: c.borderSubtle }]}>
            {row.map((key) => {
              const isOp = key.kind === "op" || key.kind === "eq";
              const opValue =
                key.label === "−"
                  ? "-"
                  : key.label === "×"
                    ? "×"
                    : key.label === "÷"
                      ? "÷"
                      : key.label;
              const bg =
                key.kind === "eq"
                  ? c.accentPressed
                  : isOp
                    ? c.surfaceElevated
                    : c.surface;
              return (
                <Pressable
                  key={key.label}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: bg,
                      borderColor: c.borderSubtle,
                      opacity: pressed ? 0.75 : 1,
                    },
                    webClickable,
                  ]}
                  onPress={() => {
                    if (key.kind === "digit" || key.kind === "zero") onDigit(key.label);
                    else if (key.kind === "dot") onDecimal();
                    else if (key.kind === "eq") onEquals();
                    else onOperator(opValue === "+" ? "+" : opValue);
                  }}
                >
                  <Text
                    style={[
                      styles.keyLabel,
                      { color: isOp ? c.accent : c.text },
                      isOp && styles.keyLabelOp,
                    ]}
                  >
                    {key.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  display: {
    flex: 1,
    fontSize: 36,
    fontWeight: "300",
    textAlign: "right",
    paddingRight: 8,
  },
  backspace: {
    padding: 8,
    borderRadius: 8,
  },
  grid: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  key: {
    flex: 1,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  keyLabel: {
    fontSize: 22,
    fontWeight: "500",
  },
  keyLabelOp: {
    fontWeight: "600",
  },
});
