import { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

import type { DayTotal } from "@/db/analysis";
import { formatMoney } from "@/lib/money";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  days: DayTotal[];
  rangeStart: Date;
  rangeEnd: Date;
  tone: "expense" | "income";
  selectedDay?: string | null;
  onSelectDay?: (day: string | null) => void;
  height?: number;
};

function dayKey(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shortLabel(isoDay: string) {
  const [, m, d] = isoDay.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[m - 1]} ${String(d).padStart(2, "0")}`;
}

function longLabel(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function FlowLineChart({
  days,
  rangeStart,
  rangeEnd,
  tone,
  selectedDay = null,
  onSelectDay,
  height = 220,
}: Props) {
  const stroke = tone === "expense" ? colors.expense : colors.income;
  const [width, setWidth] = useState(340);

  const series = useMemo(() => {
    const map = new Map(days.map((d) => [d.day, d.amount]));
    const all: string[] = [];
    const cur = new Date(rangeStart);
    const end = new Date(rangeEnd);
    cur.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      all.push(dayKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
    // Keep every day for monthly; sample only for very long ranges
    const step = all.length > 93 ? Math.ceil(all.length / 60) : 1;
    const out: { day: string; amount: number }[] = [];
    for (let i = 0; i < all.length; i += step) {
      const day = all[i];
      out.push({ day, amount: map.get(day) ?? 0 });
    }
    if (all.length && out[out.length - 1]?.day !== all[all.length - 1]) {
      const day = all[all.length - 1];
      out.push({ day, amount: map.get(day) ?? 0 });
    }
    return out;
  }, [days, rangeEnd, rangeStart]);

  const max = Math.max(...series.map((s) => s.amount), 1);
  const padL = 12;
  const padR = 12;
  const padT = 16;
  const padB = 8;
  const plotH = height - 56;
  const plotW = Math.max(40, width - padL - padR);

  const coords = series.map((s, i) => {
    const x =
      padL + (series.length <= 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
    const y = padT + plotH - (s.amount / max) * plotH;
    return { ...s, x, y };
  });

  const linePath = coords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`
      : "";

  const selected = coords.find((c) => c.day === selectedDay) ?? null;
  const labelIdx = [0, Math.floor((series.length - 1) / 2), series.length - 1].filter(
    (v, i, a) => v >= 0 && series[v] && a.indexOf(v) === i,
  );

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  }

  function hitTest(locationX: number) {
    if (coords.length === 0) return;
    let best = coords[0];
    let bestDist = Math.abs(coords[0].x - locationX);
    for (const c of coords) {
      const d = Math.abs(c.x - locationX);
      if (d < bestDist) {
        best = c;
        bestDist = d;
      }
    }
    onSelectDay?.(selectedDay === best.day ? null : best.day);
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.yRow}>
        <Text style={[styles.yMax, { color: stroke }]}>
          {tone === "expense" ? "−" : "+"}
          {formatMoney(max, { sign: "never" })}
        </Text>
        {selected ? (
          <View style={[styles.tooltip, { borderColor: stroke }]}>
            <Text style={styles.tooltipDate}>{longLabel(selected.day)}</Text>
            <Text style={[styles.tooltipAmt, { color: stroke }]}>
              {tone === "expense" ? "−" : "+"}
              {formatMoney(selected.amount, { sign: "never" })}
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>Tap a point for details</Text>
        )}
      </View>

      <Pressable
        onPress={(e) => hitTest(e.nativeEvent.locationX)}
        style={[{ height: height - 36 }, webClickable]}
      >
        <Svg width={width} height={height - 36}>
          <Defs>
            <LinearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
              <Stop offset="1" stopColor={stroke} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + plotH * t;
            return (
              <Line
                key={t}
                x1={padL}
                y1={y}
                x2={padL + plotW}
                y2={y}
                stroke={colors.borderSubtle}
                strokeWidth={1}
                strokeDasharray="4 6"
              />
            );
          })}

          <Line
            x1={padL}
            y1={padT + plotH}
            x2={padL + plotW}
            y2={padT + plotH}
            stroke={colors.border}
            strokeWidth={1.5}
          />

          {coords.some((s) => s.amount > 0) ? (
            <>
              <Path d={areaPath} fill="url(#flowFill)" />
              <Path
                d={linePath}
                fill="none"
                stroke={stroke}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {coords.map((s) => {
                const active = selectedDay === s.day;
                const hasValue = s.amount > 0;
                return (
                  <Circle
                    key={s.day}
                    cx={s.x}
                    cy={s.y}
                    r={active ? 7 : hasValue ? 4.5 : 3}
                    fill={active || hasValue ? stroke : colors.surfaceElevated}
                    stroke={active ? colors.text : colors.background}
                    strokeWidth={active ? 2.5 : 1.5}
                    opacity={hasValue || active ? 1 : 0.45}
                    onPress={() =>
                      onSelectDay?.(selectedDay === s.day ? null : s.day)
                    }
                  />
                );
              })}
              {selected ? (
                <Line
                  x1={selected.x}
                  y1={padT}
                  x2={selected.x}
                  y2={padT + plotH}
                  stroke={stroke}
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                  opacity={0.7}
                />
              ) : null}
            </>
          ) : null}
        </Svg>
      </Pressable>

      <View style={styles.xLabels}>
        {labelIdx.map((i) => (
          <Text key={series[i].day} style={styles.xLabel}>
            {shortLabel(series[i].day)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginTop: 8 },
  yRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    minHeight: 36,
    gap: 8,
  },
  yMax: {
    fontSize: 12,
    fontWeight: "700",
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  tooltip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceElevated,
    alignItems: "flex-end",
  },
  tooltipDate: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  tooltipAmt: {
    fontSize: 15,
    fontWeight: "800",
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  xLabel: { color: colors.textSecondary, fontSize: 11 },
});
