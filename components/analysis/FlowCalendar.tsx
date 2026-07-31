import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DayTotal } from "@/db/analysis";
import { formatMoney } from "@/lib/money";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  rangeStart: Date;
  rangeEnd: Date;
  days: DayTotal[];
  tone: "expense" | "income";
  selectedDay?: string | null;
  onSelectDay?: (day: string | null) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function dayKey(y: number, m: number, d: number) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatCellAmount(amount: number) {
  if (amount <= 0) return "";
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount % 1 === 0 ? String(amount.toFixed(0)) : amount.toFixed(0);
}

function heatAlpha(amount: number, max: number) {
  if (amount <= 0 || max <= 0) return 0;
  return 0.12 + (amount / max) * 0.55;
}

/** Month grid for the period’s primary month (anchor end month). */
export function FlowCalendar({
  rangeStart,
  rangeEnd,
  days,
  tone,
  selectedDay = null,
  onSelectDay,
}: Props) {
  const amountColor = tone === "expense" ? colors.expense : colors.income;
  const map = useMemo(() => new Map(days.map((d) => [d.day, d.amount])), [days]);
  const max = useMemo(
    () => Math.max(...days.map((d) => d.amount), 1),
    [days],
  );

  const year = rangeEnd.getFullYear();
  const month = rangeEnd.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();

  const cells: ({ day: number; key: string; amount: number; inRange: boolean } | null)[] =
    [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(year, month, d);
    const date = new Date(year, month, d, 12);
    const inRange =
      date >=
        new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()) &&
      date <=
        new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
    cells.push({
      day: d,
      key,
      amount: inRange ? (map.get(key) ?? 0) : 0,
      inRange,
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

  const selectedAmount = selectedDay ? (map.get(selectedDay) ?? 0) : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.monthTitle}>
        {months[month]} {year}
      </Text>

      {selectedDay && selectedAmount != null ? (
        <View style={[styles.selectedBanner, { borderColor: amountColor }]}>
          <Text style={styles.selectedDate}>{selectedDay}</Text>
          <Text style={[styles.selectedAmt, { color: amountColor }]}>
            {tone === "expense" ? "−" : "+"}
            {formatMoney(selectedAmount, { sign: "never" })}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>Tap a day to inspect</Text>
      )}

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`${w}-${i}`} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          if (cell == null) {
            return <View key={`e-${i}`} style={styles.cell} />;
          }
          const active = selectedDay === cell.key;
          const alpha = heatAlpha(cell.amount, max);
          const bg =
            cell.amount > 0
              ? tone === "expense"
                ? `rgba(232, 154, 132, ${alpha})`
                : `rgba(143, 207, 146, ${alpha})`
              : colors.surface;

          return (
            <Pressable
              key={cell.key}
              disabled={!cell.inRange}
              onPress={() =>
                onSelectDay?.(active ? null : cell.key)
              }
              style={[
                styles.cell,
                styles.cellInner,
                webClickable,
                { backgroundColor: bg },
                active && {
                  borderColor: amountColor,
                  borderWidth: 2,
                },
                !cell.inRange && styles.cellMuted,
              ]}
            >
              <Text style={[styles.dayNum, active && { color: colors.text }]}>
                {cell.day}
              </Text>
              <Text
                style={[styles.amount, { color: amountColor }]}
                numberOfLines={1}
              >
                {formatCellAmount(cell.amount)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    paddingTop: 14,
  },
  monthTitle: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    textAlign: "center",
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
  selectedBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 12,
  },
  selectedDate: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  selectedAmt: {
    fontWeight: "800",
    fontSize: 15,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    color: colors.accentMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%` as `${number}%`,
    aspectRatio: 1,
    padding: 2,
    minHeight: 54,
  },
  cellInner: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  cellMuted: {
    opacity: 0.35,
  },
  dayNum: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  amount: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
});
