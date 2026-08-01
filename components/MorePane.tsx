import { useCallback, useEffect } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ITEMS: {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: "/accounts" | "/categories";
}[] = [
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

const PANEL_W = 280;
const DISMISS_X = 80;

export function MorePane({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(PANEL_W);
  const backdrop = useSharedValue(0);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 220 });
      backdrop.value = withTiming(1, { duration: 180 });
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
    translateX.value = withTiming(PANEL_W, { duration: 180 }, (finished) => {
      if (finished) runOnJS(close)();
    });
    backdrop.value = withTiming(0, { duration: 160 });
  }, [backdrop, close, translateX]);

  const pan = Gesture.Pan()
    .enabled(Platform.OS !== "web")
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > DISMISS_X || e.velocityX > 900) {
        translateX.value = withTiming(PANEL_W, { duration: 180 }, (finished) => {
          if (finished) runOnJS(close)();
        });
        backdrop.value = withTiming(0, { duration: 160 });
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
                  paddingTop: insets.top + 16,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>
              <Text style={styles.title}>More</Text>
              <Text style={styles.sub}>Manage wallets and event types</Text>
              <View style={styles.list}>
                {ITEMS.map((item, index) => (
                  <Pressable
                    key={item.href}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityHint={`Item ${index + 1} of ${ITEMS.length}`}
                    onPress={() => {
                      close();
                      router.push(item.href as never);
                    }}
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
                      <Text style={styles.itemDesc}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </View>
            </GlassSurface>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
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
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingHorizontal: 18,
  },
  handleRow: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  handle: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  title: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "700",
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  list: { gap: 6 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
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
