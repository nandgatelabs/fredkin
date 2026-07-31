import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import type { DayTotal } from "@/db/analysis";
import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

type Props = {
  days: DayTotal[];
  rangeStart: Date;
  rangeEnd: Date;
  tone: "expense" | "income";
  height?: number;
};

function dayKey(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shortLabel(isoDay: string) {
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
  return `${months[m - 1]} ${String(d).padStart(2, "0")}`;
}

export function FlowLineChart({
  days,
  rangeStart,
  rangeEnd,
  tone,
  height = 180,
}: Props) {
  const stroke = tone === "expense" ? colors.expense : colors.income;

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
    const step = all.length > 62 ? Math.ceil(all.length / 45) : 1;
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
  const width = 340;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const plotH = height - 40;
  const plotW = width - padL - padR;

  const points = series
    .map((s, i) => {
      const x =
        padL + (series.length <= 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
      const y = padT + plotH - (s.amount / max) * plotH;
      return `${x},${y}`;
    })
    .join(" ");

  const labelIdx = [0, Math.floor((series.length - 1) / 2), series.length - 1].filter(
    (v, i, a) => v >= 0 && series[v] && a.indexOf(v) === i,
  );

  return (
    <View style={styles.wrap}>
      <Text style={[styles.yMax, { color: stroke }]}>
        {tone === "expense" ? "−" : "+"}
        {formatMoney(max, { sign: "never" })}
      </Text>
      <Svg width="100%" height={height - 22} viewBox={`0 0 ${width} ${height - 22}`}>
        <Line
          x1={padL}
          y1={padT + plotH}
          x2={padL + plotW}
          y2={padT + plotH}
          stroke={colors.borderSubtle}
          strokeWidth={1}
        />
        {series.some((s) => s.amount > 0) ? (
          <>
            <Polyline
              points={points}
              fill="none"
              stroke={stroke}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {series.map((s, i) => {
              if (s.amount <= 0) return null;
              const x =
                padL +
                (series.length <= 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
              const y = padT + plotH - (s.amount / max) * plotH;
              return <Circle key={s.day} cx={x} cy={y} r={3} fill={stroke} />;
            })}
          </>
        ) : null}
      </Svg>
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
  yMax: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  xLabel: { color: colors.textSecondary, fontSize: 11 },
});
