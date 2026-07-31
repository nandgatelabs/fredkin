import { StyleSheet, Text, type TextStyle } from "react-native";

import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

type Props = {
  amount: number;
  style?: TextStyle;
  signed?: boolean;
};

export function MoneyText({ amount, style, signed = true }: Props) {
  const tone =
    amount < 0 ? colors.expense : amount > 0 ? colors.income : colors.textSecondary;
  const value = signed
    ? formatMoney(amount, { sign: "auto" })
    : formatMoney(Math.abs(amount), { sign: "never" });

  return <Text style={[styles.base, { color: tone }, style]}>{value}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 15,
    fontWeight: "600",
  },
});
