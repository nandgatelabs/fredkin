import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DayTotal } from "@/db/analysis";
import { colors } from "@/theme";

type Props = {
  rangeStart: Date;
  rangeEnd: Date;
  days: DayTotal[];
  tone: "expense" | "income";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(y: number, m: number, d: number) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatCellAmount(amount: number, tone: "expense" | "income") {
  if (amount <= 0) return "";
  const sign = tone === "expense" ? "−" : "+";
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${sign}${k >= 10 ? k.toFixed(1) : k.toFixed(1)}k`;
  }
  return `${sign}${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1)}`;
}

/** Month grid for the period’s primary month (anchor end month). */
export function FlowCalendar({ rangeStart, rangeEnd, days, tone }: Props) {
  const amountColor = tone === "expense" ? colors.expense : colors.income;
  const map = useMemo(() => new Map(days.map((d) => [d.day, d.amount])), [days]);

  // Show calendar for the month of rangeEnd (matches monthly analysis UX)
  const year = rangeEnd.getFullYear();
  const month = rangeEnd.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();

  const cells: ({ day: number; key: string; amount: number } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(year, month, d);
    const inRange =
      new Date(year, month, d, 12) >= new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()) &&
      new Date(year, month, d, 12) <= new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
    cells.push({
      day: d,
      key,
      amount: inRange ? (map.get(key) ?? 0) : 0,
    });
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.monthTitle}>
        {months[month]} {year}
      </Text>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) =>
          cell == null ? (
            <View key={`e-${i}`} style={styles.cell} />
          ) : (
            <View key={cell.key} style={styles.cell}>
              <Text style={styles.dayNum}>{cell.day}</Text>
              <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                {formatCellAmount(cell.amount, tone)}
              </Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    paddingTop: 12,
  },
  monthTitle: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%" as `${number}%`,
    minHeight: 48,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  dayNum: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  amount: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
});
