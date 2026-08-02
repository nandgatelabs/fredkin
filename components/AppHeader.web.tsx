import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

import { GlassSurface } from "@/components/GlassSurface";
import { HeaderPeriodChip } from "@/components/shell/HeaderPeriodChip";
import { KeyboardShortcutsModal } from "@/components/shell/KeyboardShortcutsModal";
import { isMorePath } from "@/components/shell/morePaths";
import { useEffectiveDesktopLayout } from "@/hooks/useEffectiveDesktopView";
import { useCanSplit } from "@/hooks/useViewportWidth";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import {
  ALL_PANES,
  PANE_LABELS,
  useDesktopViewStore,
  type PaneId,
} from "@/store/desktopView";
import { useMorePaneStore } from "@/store/morePane";
import { useShortcutsHelpStore } from "@/store/shortcutsHelp";
import { colors, layout } from "@/theme";

const PANE_ICONS: Record<PaneId, keyof typeof Ionicons.glyphMap> = {
  events: "receipt-outline",
  insights: "pie-chart-outline",
  wallets: "wallet-outline",
  categories: "pricetag-outline",
};

/**
 * Web header: brand · search · period · pane icons · + · Split · ? · More.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const openMore = useMorePaneStore((s) => s.openMore);
  const moreActive = isMorePath(pathname);
  const layoutState = useEffectiveDesktopLayout();
  const openPane = useDesktopViewStore((s) => s.openPane);
  const enterSplit = useDesktopViewStore((s) => s.enterSplit);
  const setMode = useDesktopViewStore((s) => s.setMode);
  const canSplit = useCanSplit();
  const shortcutsOpen = useShortcutsHelpStore((s) => s.open);
  const openHelp = useShortcutsHelpStore((s) => s.openHelp);
  const closeHelp = useShortcutsHelpStore((s) => s.closeHelp);

  const splitActive = layoutState.mode === "split";
  const activePanes =
    layoutState.mode === "split"
      ? new Set<PaneId>([layoutState.left, layoutState.right])
      : new Set<PaneId>([layoutState.pane]);

  return (
    <GlassSurface style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo} accessibilityRole="header">
        Fredkin
      </Text>

      <View style={styles.searchWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search events"
          onPress={() => router.push("/search")}
          {...webFocusableProps}
          style={({ pressed }) => [
            styles.search,
            webClickable,
            pressed && styles.searchPressed,
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search
          </Text>
        </Pressable>
      </View>

      {splitActive ? <HeaderPeriodChip /> : null}

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
                openPane(pane);
                router.navigate("/");
              }}
              {...webFocusableProps}
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
          onPress={() => router.push("/record/new")}
          {...webFocusableProps}
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
            if (splitActive) setMode("single");
            else enterSplit();
            router.navigate("/");
          }}
          hitSlop={8}
          {...webFocusableProps}
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
        onPress={openMore}
        hitSlop={8}
        {...webFocusableProps}
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

      <KeyboardShortcutsModal visible={shortcutsOpen} onClose={closeHelp} />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 0.4,
    fontFamily: webFontDisplay,
    flexShrink: 0,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
    maxWidth: layout.searchMaxWidth,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.inputBg,
  },
  searchPressed: { opacity: 0.88 },
  searchPlaceholder: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 13,
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
