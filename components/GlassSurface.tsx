import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

import { useThemeColors } from "@/hooks/useThemeColors";
import { useSettingsStore } from "@/store/settings";
import { isGlassTheme } from "@/theme/palettes";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use elevated glass tint (drawers / sheets). */
  elevated?: boolean;
};

/**
 * Translucent chrome for Glass Mist / Glass Rose.
 * Web: CSS backdrop-filter. iOS 26+: native GlassView. Else: frosted rgba fallback.
 */
export function GlassSurface({ children, style, elevated = false }: Props) {
  const themeId = useSettingsStore((s) => s.themeId);
  const c = useThemeColors();
  const glass = isGlassTheme(themeId);
  const fill = elevated ? c.surfaceElevated : c.surface;

  if (!glass) {
    return <View style={[{ backgroundColor: fill }, style]}>{children}</View>;
  }

  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor={c.accent}
        style={[styles.clip, style]}
      >
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.clip,
          {
            backgroundColor: fill,
            borderColor: c.border,
            backdropFilter: "blur(20px) saturate(165%)",
            WebkitBackdropFilter: "blur(20px) saturate(165%)",
          } as ViewStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor: fill, borderColor: c.border }, styles.clip, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
