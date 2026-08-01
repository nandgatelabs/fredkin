import { useEffect, useMemo, useRef } from "react";
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
  /** Y offset of the selected day’s month inside this component (for parent scroll). */
  onSelectedMonthLayout?: (y: number) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
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

function dayKey(y: number, m: number, d: number) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatCellAmount(amount: number, tone: "expense" | "income") {
  if (amount <= 0) return "";
  const sign = tone === "expense" ? "−" : "+";
  if (amount >= 1000) return `${sign}${(amount / 1000).toFixed(1)}k`;
  return `${sign}${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1)}`;
}

function heatStyle(amount: number, max: number, tone: "expense" | "income") {
  if (amount <= 0 || max <= 0) {
    return { backgroundColor: colors.surface };
  }
  // Match chart: soft sqrt heat so mid-range days still tint
  const t = Math.min(1, Math.sqrt(amount / max));
  if (tone === "expense") {
    const a = 0.1 + t * 0.45;
    return { backgroundColor: `rgba(232, 154, 132, ${a})` };
  }
  const a = 0.1 + t * 0.45;
  return { backgroundColor: `rgba(143, 207, 146, ${a})` };
}

function monthsInRange(rangeStart: Date, rangeEnd: Date) {
  const months: { y: number; m: number }[] = [];
  let y = rangeStart.getFullYear();
  let m = rangeStart.getMonth();
  const endY = rangeEnd.getFullYear();
  const endM = rangeEnd.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    months.push({ y, m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return months;
}

type MonthGridProps = {
  year: number;
  month: number;
  rangeStart: Date;
  rangeEnd: Date;
  map: Map<string, number>;
  max: number;
  tone: "expense" | "income";
  amountColor: string;
  selectedDay: string | null;
  onSelectDay?: (day: string | null) => void;
  onLayoutY?: (y: number) => void;
};

function MonthGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  map,
  max,
  tone,
  amountColor,
  selectedDay,
  onSelectDay,
  onLayoutY,
}: MonthGridProps) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const rangeStartDay = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate(),
  );
  const rangeEndDay = new Date(
    rangeEnd.getFullYear(),
    rangeEnd.getMonth(),
    rangeEnd.getDate(),
  );

  const cells: ({
    day: number;
    key: string;
    amount: number;
    inRange: boolean;
    weekend: boolean;
  } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(year, month, d);
    const date = new Date(year, month, d, 12);
    const weekday = (startWeekday + d - 1) % 7;
    const inRange = date >= rangeStartDay && date <= rangeEndDay;
    cells.push({
      day: d,
      key,
      amount: inRange ? (map.get(key) ?? 0) : 0,
      inRange,
      weekend: weekday === 0 || weekday === 6,
    });
  }

  const isSelectedMonth =
    selectedDay != null &&
    selectedDay.startsWith(
      `${year}-${String(month + 1).padStart(2, "0")}`,
    );

  return (
    <View
      style={[styles.monthBlock, isSelectedMonth && styles.monthBlockActive]}
      onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}
    >
      <Text style={styles.monthTitle}>
        {MONTH_NAMES[month]} {year}
      </Text>
      <View style={styles.frame}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <View
              key={`${year}-${month}-${w}`}
              style={[styles.weekdayCell, (i === 0 || i === 6) && styles.weekendHeader]}
            >
              <Text style={styles.weekday}>{w}</Text>
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((cell, i) => {
            if (cell == null) {
              return <View key={`e-${year}-${month}-${i}`} style={[styles.cell, styles.cellEmpty]} />;
            }
            const active = selectedDay === cell.key;
            const heat = heatStyle(cell.amount, max, tone);
            return (
              <Pressable
                key={cell.key}
                disabled={!cell.inRange}
                onPress={() => onSelectDay?.(active ? null : cell.key)}
                style={[
                  styles.cell,
                  webClickable,
                  heat,
                  cell.weekend && !active && styles.weekendCell,
                  active && {
                    borderColor: amountColor,
                    borderWidth: 2,
                    backgroundColor:
                      tone === "expense"
                        ? "rgba(232, 154, 132, 0.35)"
                        : "rgba(143, 207, 146, 0.35)",
                  },
                  !cell.inRange && styles.cellMuted,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    cell.weekend && styles.dayNumWeekend,
                    active && styles.dayNumActive,
                    cell.amount > 0 && { color: colors.text },
                  ]}
                >
                  {cell.day}
                </Text>
                <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                  {formatCellAmount(cell.amount, tone)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Month grid(s) covering the full analysis range; scrolls to the selected day. */
export function FlowCalendar({
  rangeStart,
  rangeEnd,
  days,
  tone,
  selectedDay = null,
  onSelectDay,
  onSelectedMonthLayout,
}: Props) {
  const amountColor = tone === "expense" ? colors.expense : colors.income;
  const map = useMemo(() => new Map(days.map((d) => [d.day, d.amount])), [days]);
  const max = useMemo(() => Math.max(...days.map((d) => d.amount), 1), [days]);
  const months = useMemo(
    () => monthsInRange(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );
  const selectedAmount = selectedDay ? (map.get(selectedDay) ?? 0) : null;
  const monthY = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!selectedDay || !onSelectedMonthLayout) return;
    const key = selectedDay.slice(0, 7); // YYYY-MM
    const y = monthY.current[key];
    if (y == null) return;
    onSelectedMonthLayout(y);
  }, [onSelectedMonthLayout, selectedDay]);

  return (
    <View style={styles.wrap}>
      {selectedDay && selectedAmount != null ? (
        <View style={[styles.selectedBanner, { borderColor: amountColor }]}>
          <Text style={styles.selectedDate}>{selectedDay}</Text>
          <Text style={[styles.selectedAmt, { color: amountColor }]}>
            {tone === "expense" ? "−" : "+"}
            {formatMoney(selectedAmount, { sign: "never" })}
          </Text>
        </View>
      ) : null}

      {months.map(({ y, m }) => {
        const key = `${y}-${String(m + 1).padStart(2, "0")}`;
        return (
          <MonthGrid
            key={key}
            year={y}
            month={m}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            map={map}
            max={max}
            tone={tone}
            amountColor={amountColor}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            onLayoutY={(layoutY) => {
              monthY.current[key] = layoutY;
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    paddingTop: 8,
    gap: 16,
  },
  monthBlock: {
    gap: 10,
  },
  monthBlockActive: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    backgroundColor: "rgba(232, 212, 138, 0.04)",
  },
  monthTitle: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
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
  frame: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  weekRow: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  weekendHeader: {
    backgroundColor: "rgba(232, 212, 138, 0.08)",
  },
  weekday: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%` as `${number}%`,
    minHeight: 72,
    paddingTop: 6,
    paddingHorizontal: 4,
    paddingBottom: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    borderBottomColor: colors.border,
    justifyContent: "space-between",
  },
  cellEmpty: {
    backgroundColor: colors.inputBg,
  },
  weekendCell: {
    backgroundColor: "rgba(232, 212, 138, 0.04)",
  },
  cellMuted: {
    opacity: 0.4,
  },
  dayNum: {
    color: colors.accentMuted,
    fontSize: 15,
    fontWeight: "700",
    alignSelf: "flex-start",
  },
  dayNumWeekend: {
    color: colors.accent,
  },
  dayNumActive: {
    color: colors.text,
  },
  amount: {
    fontSize: 12,
    fontWeight: "800",
    alignSelf: "center",
    marginTop: 4,
  },
});
