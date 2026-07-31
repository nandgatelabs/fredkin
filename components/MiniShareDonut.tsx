import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { colors } from "@/theme";

type Props = {
  /** 0–100 */
  percent: number;
  size?: number;
  color?: string;
};

/** Single-slice share donut for category details. */
export function MiniShareDonut({
  percent,
  size = 88,
  color = colors.accent,
}: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * c;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.borderSubtle}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${Math.max(0, c - dash)}`}
          />
        </G>
      </Svg>
    </View>
  );
}
