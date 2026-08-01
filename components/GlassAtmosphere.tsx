import { StyleSheet, View } from "react-native";

import { useSettingsStore } from "@/store/settings";
import { isGlassTheme, normalizeThemeId } from "@/theme/palettes";

/**
 * Soft color blobs behind translucent chrome so Glass themes read as frosted glass.
 * No-op for solid themes.
 */
export function GlassAtmosphere() {
  const themeId = normalizeThemeId(useSettingsStore((s) => s.themeId));
  if (!isGlassTheme(themeId)) return null;

  const rose = themeId === "glassRose";

  return (
    <View style={styles.root} pointerEvents="none">
      <View
        style={[
          styles.blob,
          styles.blobA,
          { backgroundColor: rose ? "rgba(244, 114, 182, 0.4)" : "rgba(91, 157, 255, 0.35)" },
        ]}
      />
      <View
        style={[
          styles.blob,
          styles.blobB,
          { backgroundColor: rose ? "rgba(251, 113, 133, 0.28)" : "rgba(45, 212, 191, 0.22)" },
        ]}
      />
      <View
        style={[
          styles.blob,
          styles.blobC,
          { backgroundColor: rose ? "rgba(192, 132, 252, 0.22)" : "rgba(167, 139, 250, 0.16)" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobA: {
    width: 280,
    height: 280,
    top: -80,
    left: -60,
  },
  blobB: {
    width: 260,
    height: 260,
    top: 180,
    right: -90,
  },
  blobC: {
    width: 220,
    height: 220,
    bottom: 40,
    left: 40,
  },
});
