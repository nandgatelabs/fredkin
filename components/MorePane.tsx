import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/GlassSurface";
import { InfoModal } from "@/components/InfoModal";
import { isMoreStackPath } from "@/components/shell/morePaths";
import { useKeydown } from "@/hooks/useKeydown";
import { downloadTextFile } from "@/lib/download";
import { getLogText, log } from "@/lib/logger";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { useMorePaneStore } from "@/store/morePane";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const MANAGE: NavItem[] = [
  {
    label: "Wallets",
    description: "Balances and accounts",
    icon: "wallet-outline",
    href: "/accounts",
  },
  {
    label: "Event Type",
    description: "Spend and income types",
    icon: "pricetag-outline",
    href: "/categories",
  },
];

/** On web, Wallets / Event Type live in the header pane switcher. */
const MANAGE_ITEMS = Platform.OS === "web" ? [] : MANAGE;

const APP: NavItem[] = [
  { label: "Settings", icon: "settings-outline", href: "/preferences" },
  { label: "Data", icon: "folder-outline", href: "/data" },
  { label: "Support", icon: "help-circle-outline", href: "/help" },
  { label: "Reset", icon: "trash-outline", href: "/reset" },
];

const PANEL_W = 280;
const DISMISS_X = 80;
/** Soft leading edge only — top/right/bottom stay flush to the screen. */
const PANEL_RADIUS = 20;

export function MorePane({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const leaveForStack = useMorePaneStore((s) => s.leaveForStack);
  const translateX = useSharedValue(PANEL_W);
  const backdrop = useSharedValue(0);
  const [logStatus, setLogStatus] = useState<string | null>(null);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 240 });
      backdrop.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = PANEL_W;
      backdrop.value = 0;
    }
  }, [visible, translateX, backdrop]);

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      },
      [close],
    ),
  );

  const dismissAnimated = useCallback(() => {
    translateX.value = withTiming(PANEL_W, { duration: 200 }, (finished) => {
      if (finished) runOnJS(close)();
    });
    backdrop.value = withTiming(0, { duration: 180 });
  }, [backdrop, close, translateX]);

  const pushAfterLeave = useCallback(
    (href: string) => {
      // Push first so pathname is on the stack before returnToMore is armed.
      router.push(href as never);
      leaveForStack();
    },
    [leaveForStack, router],
  );

  const go = useCallback(
    (href: string) => {
      log.debug("ui more navigate", { href });
      const toStack = isMoreStackPath(href);
      if (!toStack) {
        close();
        router.push(href as never);
        return;
      }
      // Slide the sheet away, then push so Back can reopen it smoothly.
      translateX.value = withTiming(PANEL_W, { duration: 200 }, (finished) => {
        if (finished) runOnJS(pushAfterLeave)(href);
      });
      backdrop.value = withTiming(0, { duration: 180 });
    },
    [backdrop, close, pushAfterLeave, router, translateX],
  );

  const pan = Gesture.Pan()
    .enabled(Platform.OS !== "web")
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > DISMISS_X || e.velocityX > 900) {
        translateX.value = withTiming(PANEL_W, { duration: 200 }, (finished) => {
          if (finished) runOnJS(close)();
        });
        backdrop.value = withTiming(0, { duration: 180 });
      } else {
        translateX.value = withTiming(0, { duration: 180 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismissAnimated}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissAnimated}
          accessibilityLabel="Close more"
        >
          <Animated.View style={[styles.scrim, scrimStyle]} />
        </Pressable>

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.panelWrap, panelStyle]}>
            <GlassSurface
              elevated
              style={[
                styles.panel,
                {
                  paddingTop: Math.max(insets.top, 8) + 8,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              <Text style={styles.brand}>Fredkin</Text>
              <Text style={styles.tagline}>Fredkin by NandGateLabs</Text>
              <Text style={styles.sub}>Offline ledger. Your device only.</Text>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {MANAGE_ITEMS.length > 0 ? (
                  <>
                    <Text style={styles.section}>Manage</Text>
                    {MANAGE_ITEMS.map((item) => (
                      <MoreRow
                        key={item.href}
                        item={item}
                        onPress={() => go(item.href)}
                      />
                    ))}
                  </>
                ) : null}

                <Text
                  style={[
                    styles.section,
                    MANAGE_ITEMS.length > 0 && styles.sectionSpaced,
                  ]}
                >
                  App
                </Text>
                {APP.map((item) => (
                  <MoreRow
                    key={item.href}
                    item={item}
                    onPress={() => go(item.href)}
                  />
                ))}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Export Logs"
                  onPress={() => {
                    void (async () => {
                      try {
                        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                        const name = `fredkin-logs_${stamp}.txt`;
                        const saved = await downloadTextFile(
                          name,
                          getLogText(),
                          "text/plain",
                        );
                        log.info("Logs exported", saved.locationLabel);
                        setLogStatus(`Logs saved:\n${saved.locationLabel}`);
                      } catch (e) {
                        log.error("Log export failed", e);
                        setLogStatus(
                          e instanceof Error ? e.message : "Log export failed",
                        );
                      }
                    })();
                  }}
                  {...webFocusableProps}
                  style={({ pressed }) => [
                    styles.item,
                    webClickable,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Ionicons name="bug-outline" size={20} color={colors.accent} />
                  <View style={styles.itemText}>
                    <Text style={styles.itemLabel}>Export Logs</Text>
                  </View>
                </Pressable>
              </ScrollView>

              <InfoModal
                visible={logStatus != null}
                title="Export Logs"
                message={logStatus ?? ""}
                onClose={() => setLogStatus(null)}
              />
            </GlassSurface>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

function MoreRow({ item, onPress }: { item: NavItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={onPress}
      {...webFocusableProps}
      style={({ pressed }) => [
        styles.item,
        webClickable,
        pressed && styles.itemPressed,
      ]}
    >
      <Ionicons name={item.icon} size={20} color={colors.accent} />
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{item.label}</Text>
        {item.description ? (
          <Text style={styles.itemDesc}>{item.description}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  panelWrap: {
    height: "100%",
    width: PANEL_W,
    maxWidth: "82%",
    zIndex: 2,
  },
  panel: {
    flex: 1,
    // Leading edge soft; top / right / bottom flush to the screen.
    borderTopLeftRadius: PANEL_RADIUS,
    borderBottomLeftRadius: PANEL_RADIUS,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    paddingHorizontal: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 16,
        shadowOffset: { width: -4, height: 0 },
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  brand: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: "600",
    fontStyle: "italic",
    fontFamily: webFontDisplay,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  section: {
    color: colors.accentMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 10,
  },
  sectionSpaced: {
    marginTop: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  itemPressed: {
    backgroundColor: colors.accentSoft,
  },
  itemText: { flex: 1, gap: 2 },
  itemLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  itemDesc: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
