import { type ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  children: ReactNode;
};

/**
 * On web/desktop, center a phone-width app frame so the mobile UI is usable
 * instead of stretching across an ultrawide monitor. Native is a pass-through.
 */
export function WebAppShell({ children }: Props) {
  const { height } = useWindowDimensions();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const phoneHeight = Math.min(
    Math.max(height - 88, 560),
    layout.webPhoneMaxHeight,
  );

  return (
    <View style={styles.stage}>
      <View style={[styles.glow, styles.glowA]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowB]} pointerEvents="none" />

      <View style={[styles.phoneChrome, { height: phoneHeight }]}>
        <View style={styles.speaker} pointerEvents="none" />
        <View style={styles.phoneScreen}>{children}</View>
      </View>

      <Text style={styles.caption}>money-money · web preview</Text>
      <Text style={styles.subCaption}>One browser tab only (SQLite OPFS lock)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
    backgroundColor: "#141310",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
  },
  glowA: {
    width: 420,
    height: 420,
    backgroundColor: "rgba(229, 211, 138, 0.07)",
    top: "12%",
    left: "18%",
  },
  glowB: {
    width: 360,
    height: 360,
    backgroundColor: "rgba(129, 199, 132, 0.05)",
    bottom: "10%",
    right: "16%",
  },
  phoneChrome: {
    width: "100%",
    maxWidth: layout.webPhoneWidth,
    borderRadius: 28,
    padding: 10,
    backgroundColor: "#0E0D0B",
    borderWidth: 1,
    borderColor: "#3A372C",
  },
  speaker: {
    alignSelf: "center",
    width: 96,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2A2822",
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caption: {
    marginTop: 14,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    fontFamily: "Fraunces, Georgia, serif",
    fontStyle: "italic",
  },
  subCaption: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
  },
});
