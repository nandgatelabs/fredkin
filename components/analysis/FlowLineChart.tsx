import { useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
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

/** Sqrt scale so small daily totals stay visible when one day dominates. */
function visualRatio(amount: number, max: number) {
  if (max <= 0 || amount <= 0) return 0;
  return Math.sqrt(amount / max);
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
  const hitRef = useRef<ViewType | null>(null);

  // Every calendar day in the analysis period — no sampling, so chart ↔ calendar map 1:1.
  const series = useMemo(() => {
    const map = new Map(days.map((d) => [d.day, d.amount]));
    const out: { day: string; amount: number }[] = [];
    const cur = new Date(rangeStart);
    const end = new Date(rangeEnd);
    cur.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      const day = dayKey(cur);
      out.push({ day, amount: map.get(day) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [days, rangeEnd, rangeStart]);

  const max = Math.max(...series.map((s) => s.amount), 1);
  const padL = 12;
  const padR = 12;
  const padT = 16;
  const plotH = height - 56;
  const plotW = Math.max(40, width - padL - padR);

  const coords = series.map((s, i) => {
    const x =
      padL + (series.length <= 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
    const y = padT + plotH - visualRatio(s.amount, max) * plotH;
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

  // Tick labels stay in real money space (not sqrt); positions use the same visual curve.
  const yTickAmounts = [max, max * 0.5, max * 0.2, 0];

  return (
    <View style={styles.wrap}>
      {selected ? (
        <View style={[styles.tooltip, { borderColor: stroke }]}>
          <Text style={styles.tooltipDate}>{longLabel(selected.day)}</Text>
          <Text style={[styles.tooltipAmt, { color: stroke }]}>
            {tone === "expense" ? "−" : "+"}
            {formatMoney(selected.amount, { sign: "never" })}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>Tap the chart or a calendar day</Text>
      )}

      <View style={styles.chartRow}>
        <View style={[styles.yAxis, { height: height - 36 }]}>
          {yTickAmounts.map((v, i) => (
            <Text key={i} style={[styles.yTick, { color: stroke }]} numberOfLines={1}>
              {tone === "expense" ? "−" : "+"}
              {formatMoney(v, { sign: "never" })}
            </Text>
          ))}
        </View>

        <Pressable
          ref={hitRef}
          onLayout={onLayout}
          onPress={(e) => {
            const { pageX, locationX } = e.nativeEvent;
            if (Platform.OS === "web" && hitRef.current) {
              hitRef.current.measureInWindow((wx) => {
                hitTest(pageX - wx);
              });
              return;
            }
            hitTest(locationX);
          }}
          style={[{ height: height - 36, flex: 1 }, webClickable]}
        >
          <Svg width={width} height={height - 36} pointerEvents="none">
            <Defs>
              <LinearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
                <Stop offset="1" stopColor={stroke} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {yTickAmounts.map((amt, i) => {
              const y = padT + plotH - visualRatio(amt, max) * plotH;
              return (
                <Line
                  key={i}
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke={colors.borderSubtle}
                  strokeWidth={i === yTickAmounts.length - 1 ? 1.5 : 1}
                  strokeDasharray={i === yTickAmounts.length - 1 ? undefined : "4 6"}
                />
              );
            })}

            {coords.some((s) => s.amount > 0) ? (
              <>
                <Path d={areaPath} fill="url(#flowFill)" />
                <Path
                  d={linePath}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {coords.map((s) => {
                  if (s.amount <= 0 && selectedDay !== s.day) return null;
                  const active = selectedDay === s.day;
                  return (
                    <Circle
                      key={s.day}
                      cx={s.x}
                      cy={s.y}
                      r={active ? 7 : s.amount > 0 ? 3.5 : 3}
                      fill={active || s.amount > 0 ? stroke : colors.surfaceElevated}
                      stroke={active ? colors.text : colors.background}
                      strokeWidth={active ? 2.5 : 1.2}
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
      </View>

      <View style={styles.xLabels}>
        <View style={styles.yAxisSpacer} />
        <View style={styles.xLabelRow}>
          {labelIdx.map((i) => (
            <Text key={series[i].day} style={styles.xLabel}>
              {shortLabel(series[i].day)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginTop: 8 },
  chartRow: { flexDirection: "row", alignItems: "stretch" },
  yAxis: {
    width: 64,
    justifyContent: "space-between",
    paddingRight: 4,
  },
  yTick: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  tooltip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 8,
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tooltipDate: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipAmt: {
    fontSize: 16,
    fontWeight: "800",
  },
  xLabels: {
    flexDirection: "row",
    marginTop: 2,
  },
  yAxisSpacer: { width: 64 },
  xLabelRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  xLabel: { color: colors.textSecondary, fontSize: 11 },
});
