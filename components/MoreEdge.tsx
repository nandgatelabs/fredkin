import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";

import { MorePane } from "@/components/MorePane";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

const MORE_PATHS = [
  "/accounts",
  "/categories",
  "/budgets",
  "/preferences",
  "/data",
  "/help",
  "/reset",
];

/**
 * Right-edge vertical tab (edge-panel pattern) that opens the More drawer.
 * Mounted at tabs layout root so the modal sits above the tab bar.
 */
export function MoreEdge() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      {!open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open more"
          accessibilityState={{ selected: active }}
          onPress={() => setOpen(true)}
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
      ) : null}
      <MorePane visible={open} onClose={() => setOpen(false)} />
    </>
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
