import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { GlassSurface } from "@/components/GlassSurface";
import { HeaderPeriodChip } from "@/components/shell/HeaderPeriodChip";
import { KeyboardShortcutsModal } from "@/components/shell/KeyboardShortcutsModal";
import { isMorePath } from "@/components/shell/morePaths";
import { useEffectiveDesktopLayout } from "@/hooks/useEffectiveDesktopView";
import { useCanSplit } from "@/hooks/useViewportWidth";
import { log } from "@/lib/logger";
import {
  webClickable,
  webFocusableProps,
  webFontDisplay,
  webTitle,
} from "@/lib/web";
import {
  ALL_PANES,
  PANE_LABELS,
  useDesktopViewStore,
  type PaneId,
} from "@/store/desktopView";
import { useSearchModalStore } from "@/store/searchModal";
import { useShortcutsHelpStore } from "@/store/shortcutsHelp";
import { colors, layout } from "@/theme";

const PANE_ICONS: Record<PaneId, keyof typeof Ionicons.glyphMap> = {
  events: "receipt-outline",
  insights: "pie-chart-outline",
  wallets: "wallet-outline",
  categories: "pricetag-outline",
};

/**
 * Web header: brand | centered search | period · panes · + · tools
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const moreActive = isMorePath(pathname);
  const openSearch = useSearchModalStore((s) => s.openSearch);
  const searchOpen = useSearchModalStore((s) => s.open);
  const layoutState = useEffectiveDesktopLayout();
  const openPane = useDesktopViewStore((s) => s.openPane);
  const enterSplit = useDesktopViewStore((s) => s.enterSplit);
  const setMode = useDesktopViewStore((s) => s.setMode);
  const canSplit = useCanSplit();
  const shortcutsOpen = useShortcutsHelpStore((s) => s.open);
  const openHelp = useShortcutsHelpStore((s) => s.openHelp);
  const closeHelp = useShortcutsHelpStore((s) => s.closeHelp);
  const [displayOpen, setDisplayOpen] = useState(false);

  const splitActive = layoutState.mode === "split";
  const activePanes =
    layoutState.mode === "split"
      ? new Set<PaneId>([layoutState.left, layoutState.right])
      : new Set<PaneId>([layoutState.pane]);

  return (
    <GlassSurface style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      {/* True optical center: search is centered on the header bar, not the flex gap. */}
      <View style={styles.searchCenter} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search events"
          accessibilityState={{ selected: searchOpen }}
          onPress={openSearch}
          {...webFocusableProps}
          {...webTitle("Search (⌘K)")}
          style={({ pressed }) => [
            styles.search,
            webClickable,
            searchOpen && styles.searchActive,
            pressed && styles.searchPressed,
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search
          </Text>
        </Pressable>
      </View>

      <View style={styles.left}>
        <Text style={styles.logo} accessibilityRole="header">
          Fredkin
        </Text>
      </View>

      <View style={styles.right}>
        <HeaderPeriodChip />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Display options"
          onPress={() => {
            log.debug("ui display options open");
            setDisplayOpen(true);
          }}
          hitSlop={8}
          {...webFocusableProps}
          {...webTitle("Display options")}
          style={({ pressed }) => [
            styles.toolBtn,
            webClickable,
            pressed && styles.toolBtnPressed,
          ]}
        >
          <Ionicons name="options-outline" size={18} color={colors.tabInactive} />
        </Pressable>

        <View style={styles.navCluster} accessibilityRole="toolbar">
          {ALL_PANES.map((pane) => {
            const selected = activePanes.has(pane);
            return (
              <Pressable
                key={pane}
                accessibilityRole="button"
                accessibilityLabel={PANE_LABELS[pane]}
                accessibilityState={{ selected }}
                onPress={() => {
                  log.debug("ui pane", { pane });
                  openPane(pane);
                  router.navigate("/");
                }}
                {...webFocusableProps}
                {...webTitle(PANE_LABELS[pane])}
                style={({ pressed }) => [
                  styles.navIcon,
                  webClickable,
                  selected && styles.navIconActive,
                  pressed && styles.navIconPressed,
                ]}
              >
                <Ionicons
                  name={PANE_ICONS[pane]}
                  size={18}
                  color={selected ? colors.accent : colors.tabInactive}
                />
              </Pressable>
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add event"
            onPress={() => {
              log.debug("ui add event");
              router.push("/record/new");
            }}
            {...webFocusableProps}
            {...webTitle("Add event (N)")}
            style={({ pressed }) => [
              styles.addBtn,
              webClickable,
              pressed && styles.addPressed,
            ]}
          >
            <Ionicons name="add" size={20} color={colors.onAccent} />
          </Pressable>
        </View>

        {canSplit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Split view"
            accessibilityState={{ selected: splitActive }}
            onPress={() => {
              log.debug(splitActive ? "ui split off" : "ui split on");
              if (splitActive) setMode("single");
              else enterSplit();
              router.navigate("/");
            }}
            hitSlop={8}
            {...webFocusableProps}
            {...webTitle(splitActive ? "Exit split (S)" : "Split view (S)")}
            style={({ pressed }) => [
              styles.toolBtn,
              webClickable,
              splitActive && styles.toolBtnActive,
              pressed && styles.toolBtnPressed,
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={splitActive ? colors.accent : colors.tabInactive}
            />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keyboard shortcuts"
          onPress={openHelp}
          hitSlop={8}
          {...webFocusableProps}
          {...webTitle("Keyboard shortcuts (?)")}
          style={({ pressed }) => [
            styles.toolBtn,
            webClickable,
            pressed && styles.toolBtnPressed,
          ]}
        >
          <Ionicons
            name="help-circle-outline"
            size={18}
            color={colors.tabInactive}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open more"
          accessibilityState={{ selected: moreActive }}
          onPress={() => {
            if (pathname === "/more") router.back();
            else router.push("/more");
          }}
          hitSlop={8}
          {...webFocusableProps}
          {...webTitle("More (M)")}
          style={({ pressed }) => [
            styles.toolBtn,
            webClickable,
            moreActive && styles.toolBtnActive,
            pressed && styles.toolBtnPressed,
          ]}
        >
          <Ionicons
            name="menu-outline"
            size={20}
            color={moreActive ? colors.accent : colors.tabInactive}
          />
        </Pressable>
      </View>

      <KeyboardShortcutsModal visible={shortcutsOpen} onClose={closeHelp} />
      <DisplayOptionsModal
        visible={displayOpen}
        onClose={() => setDisplayOpen(false)}
      />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    position: "relative",
    zIndex: 1,
  },
  searchCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  left: {
    zIndex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    flexShrink: 0,
  },
  right: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexShrink: 1,
  },
  logo: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 0.3,
    fontFamily: webFontDisplay,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: layout.searchMaxWidth,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.inputBg,
  },
  searchActive: {
    backgroundColor: colors.accentSoft,
  },
  searchPressed: { opacity: 0.88 },
  searchPlaceholder: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 14,
  },
  navCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  navIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActive: { backgroundColor: colors.accentSoft },
  navIconPressed: { backgroundColor: colors.accentSoft },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    marginHorizontal: 2,
  },
  addPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toolBtnActive: { backgroundColor: colors.accentSoft },
  toolBtnPressed: { backgroundColor: colors.accentSoft },
});
