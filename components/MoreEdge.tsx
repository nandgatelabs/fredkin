import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";

import { isMorePath } from "@/components/shell/morePaths";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useMorePaneStore } from "@/store/morePane";
import { colors } from "@/theme";

/**
 * Native right-edge tab that opens More.
 * Web uses `MoreEdge.web.tsx` (header control instead).
 */
export function MoreEdge() {
  const open = useMorePaneStore((s) => s.open);
  const openMore = useMorePaneStore((s) => s.openMore);
  const pathname = usePathname();
  const active = isMorePath(pathname);

  if (open) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open more"
      accessibilityState={{ selected: active }}
      onPress={openMore}
      {...webFocusableProps}
      style={({ pressed }) => [
        styles.tab,
        webClickable,
        active && styles.tabActive,
        pressed && styles.tabPressed,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={16}
        color={active ? colors.accent : colors.tabInactive}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -32,
    width: 18,
    height: 64,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
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
