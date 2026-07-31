import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/theme";

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
  return (
    <View style={styles.wrap}>
      <View style={styles.displayRow}>
        <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
          {expression}
        </Text>
        <Pressable onPress={onBackspace} hitSlop={8} style={styles.backspace}>
          <Ionicons name="backspace-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key) => {
              const isOp = key.kind === "op" || key.kind === "eq";
              const opValue =
                key.label === "−" ? "-" : key.label === "×" ? "×" : key.label === "÷" ? "÷" : key.label;
              return (
                <Pressable
                  key={key.label}
                  style={[styles.key, isOp && styles.keyOp, key.kind === "zero" && styles.keyZero]}
                  onPress={() => {
                    if (key.kind === "digit" || key.kind === "zero") onDigit(key.label);
                    else if (key.kind === "dot") onDecimal();
                    else if (key.kind === "eq") onEquals();
                    else onOperator(opValue === "+" ? "+" : opValue);
                  }}
                >
                  <Text style={[styles.keyLabel, isOp && styles.keyLabelOp]}>{key.label}</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  display: {
    flex: 1,
    color: colors.accent,
    fontSize: 36,
    fontWeight: "300",
    textAlign: "right",
    paddingRight: 8,
  },
  backspace: {
    padding: 6,
  },
  grid: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  key: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  keyZero: {
    // 0 is single cell; layout already 4 cols
  },
  keyOp: {
    backgroundColor: "#4A4638",
  },
  keyLabel: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "400",
  },
  keyLabelOp: {
    color: colors.text,
    fontWeight: "500",
  },
});
