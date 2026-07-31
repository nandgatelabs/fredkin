import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { analysisColor } from "@/lib/analysisPalette";
import { colors } from "@/theme";

export type DonutSegment = {
  amount: number;
  color: string;
};

type Props = {
  segments: DonutSegment[];
  label: string;
  size?: number;
};

export function donutColor(index: number, _preferred?: string | null) {
  return analysisColor(index);
}

/** Simple donut via stroke-dasharray circles (no path math). */
export function DonutChart({ segments, label, size = 160 }: Props) {
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.amount, 0);
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs =
    total <= 0
      ? null
      : segments.map((seg, i) => {
          const len = (seg.amount / total) * c;
          const node = (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return node;
        });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.borderSubtle}
          strokeWidth={stroke}
          fill="none"
        />
        <G transform={`rotate(-90 ${cx} ${cy})`}>{arcs}</G>
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    pointerEvents: "none",
  },
  label: {
    color: colors.accentMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
