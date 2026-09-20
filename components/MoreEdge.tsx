import { Platform, Pressable, StyleSheet, View } from "react-native";
import { usePathname } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { isMorePath } from "@/components/shell/morePaths";
import { log } from "@/lib/logger";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useMorePaneStore } from "@/store/morePane";
import { colors } from "@/theme";

/**
 * Native More affordance: plain edge pill + swipe-in from the right edge.
 * Web uses `MoreEdge.web.tsx` (header control instead).
 */
export function MoreEdge() {
  const open = useMorePaneStore((s) => s.open);
  const openMore = useMorePaneStore((s) => s.openMore);
  const pathname = usePathname();
  const active = isMorePath(pathname);

  const openFromEdge = () => {
    log.debug("ui more open", { via: "edge-swipe" });
    openMore();
  };

  const edgeSwipe = Gesture.Pan()
    .enabled(Platform.OS !== "web" && !open)
    .activeOffsetX([-12, 12])
    .failOffsetY([-28, 28])
    .onEnd((e) => {
      if (e.translationX < -24 || e.velocityX < -350) {
        runOnJS(openFromEdge)();
      }
    });

  if (open || pathname.startsWith("/record")) return null;

  return (
    <>
      <GestureDetector gesture={edgeSwipe}>
        <View
          style={styles.edgeZone}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </GestureDetector>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open more"
        accessibilityState={{ selected: active }}
        onPress={() => {
          log.debug("ui more open", { via: "edge-tab" });
          openMore();
        }}
        {...webFocusableProps}
        style={({ pressed }) => [
          styles.tab,
          webClickable,
          active && styles.tabActive,
          pressed && styles.tabPressed,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  edgeZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 36,
    zIndex: 28,
  },
  tab: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -44,
    width: 22,
    height: 88,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    zIndex: 30,
    elevation: 30,
  },
  tabActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  tabPressed: {
    opacity: 0.85,
  },
});
