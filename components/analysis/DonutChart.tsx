import { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { analysisColor } from "@/lib/analysisPalette";
import { formatMoney } from "@/lib/money";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

export type DonutSegment = {
  amount: number;
  color: string;
  name?: string;
  percent?: number;
};

type Props = {
  segments: DonutSegment[];
  label: string;
  tone: "expense" | "income";
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
};

export function donutColor(index: number, _preferred?: string | null) {
  return analysisColor(index);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
) {
  const large = endAngle - startAngle > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, startAngle);
  const o2 = polar(cx, cy, rOuter, endAngle);
  const i1 = polar(cx, cy, rInner, endAngle);
  const i2 = polar(cx, cy, rInner, startAngle);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

/** Angle from top, clockwise, matching SVG slice layout (0° at 12 o'clock). */
function angleFromPoint(cx: number, cy: number, x: number, y: number) {
  const dx = x - cx;
  const dy = y - cy;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

export function DonutChart({
  segments,
  label,
  tone,
  selectedIndex = null,
  onSelect,
}: Props) {
  const { width } = useWindowDimensions();
  const size = Platform.OS === "web" ? Math.min(280, Math.max(220, width * 0.42)) : 200;
  const stroke = Platform.OS === "web" ? 42 : 34;
  const rOuter = size / 2 - 4;
  const rInner = rOuter - stroke;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((s, seg) => s + seg.amount, 0);
  const amountColor = tone === "expense" ? colors.expense : colors.income;

  const slices = useMemo(() => {
    if (total <= 0) return [];
    let angle = 0;
    return segments.map((seg, i) => {
      const sweep = (seg.amount / total) * 360;
      const start = angle;
      const end = angle + Math.max(sweep, 0.4);
      angle += sweep;
      return {
        index: i,
        start,
        end: Math.min(end, 360),
        path: donutSlicePath(cx, cy, rInner, rOuter, start, Math.min(end, 359.999)),
        color: seg.color,
      };
    });
  }, [cx, cy, rInner, rOuter, segments, total]);

  const selected = selectedIndex != null ? segments[selectedIndex] : null;

  function hitTest(x: number, y: number) {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < rInner || dist > rOuter) {
      onSelect?.(null);
      return;
    }
    const deg = angleFromPoint(cx, cy, x, y);
    const hit = slices.find((s) => deg >= s.start && deg < s.end);
    if (!hit) {
      onSelect?.(null);
      return;
    }
    onSelect?.(selectedIndex === hit.index ? null : hit.index);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={(e) => hitTest(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        style={[styles.chartHit, { width: size, height: size }, webClickable]}
      >
        <Svg width={size} height={size} pointerEvents="none">
          <Path
            d={donutSlicePath(cx, cy, rInner, rOuter, 0, 359.999)}
            fill={colors.borderSubtle}
            opacity={0.35}
          />
          <G>
            {slices.map((slice) => {
              const active = selectedIndex === slice.index;
              return (
                <Path
                  key={slice.index}
                  d={slice.path}
                  fill={slice.color}
                  opacity={selectedIndex == null || active ? 1 : 0.35}
                  stroke={active ? colors.text : "transparent"}
                  strokeWidth={active ? 2 : 0}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.center}>
          {selected ? (
            <>
              <Text style={styles.centerName} numberOfLines={2}>
                {selected.name ?? label}
              </Text>
              <Text style={[styles.centerPercent, { color: amountColor }]}>
                {(selected.percent ?? 0).toFixed(1)}%
              </Text>
              <Text style={styles.centerAmount}>
                {formatMoney(tone === "expense" ? -selected.amount : selected.amount, {
                  sign: "auto",
                })}
              </Text>
            </>
          ) : (
            <Text style={styles.centerLabel}>{label}</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

/** Compact horizontal legend chips under the donut. */
export function DonutLegend({
  segments,
  selectedIndex,
  onSelect,
}: {
  segments: DonutSegment[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}) {
  return (
    <View style={styles.legend}>
      {segments.map((s, i) => {
        const active = selectedIndex === i;
        return (
          <Pressable
            key={`${s.name}-${i}`}
            onPress={() => onSelect(active ? null : i)}
            style={[
              styles.chip,
              webClickable,
              active && { borderColor: s.color, backgroundColor: `${s.color}22` },
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: s.color }]} />
            <Text style={[styles.chipText, active && styles.chipTextOn]} numberOfLines={1}>
              {s.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  chartHit: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    pointerEvents: "none",
  },
  centerLabel: {
    color: colors.accentMuted,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  centerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  centerPercent: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  centerAmount: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    maxWidth: 160,
  },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  chipTextOn: { color: colors.text },
});
