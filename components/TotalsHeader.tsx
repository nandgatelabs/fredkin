import { StyleSheet, Text, View } from "react-native";

import { MoneyText } from "@/components/MoneyText";
import type { Totals } from "@/db/types";
import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

type Props = {
  totals: Totals;
};

export function TotalsHeader({ totals }: Props) {
  const balanceTone =
    totals.allAccountsBalance >= 0 ? colors.income : colors.expense;
  return (
    <View style={styles.wrap}>
      <Text style={styles.all}>
        [ All Wallets{" "}
        <Text style={{ color: balanceTone }}>
          {formatMoney(totals.allAccountsBalance, { sign: "auto" })}
        </Text>{" "}
        ]
      </Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>SPEND SO FAR</Text>
          <MoneyText amount={-Math.abs(totals.expenseSoFar)} />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>INCOME SO FAR</Text>
          <MoneyText amount={Math.abs(totals.incomeSoFar)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  all: {
    textAlign: "center",
    color: colors.accent,
    fontSize: 15,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  col: {
    alignItems: "center",
    gap: 4,
  },
  label: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
