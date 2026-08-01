import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

export function MorePane({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      },
      [onClose],
    ),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close more" />
        <GlassSurface
          elevated
          style={[
            styles.panel,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
          ]}
        >
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
                  onClose();
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    maxWidth: "82%",
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingHorizontal: 18,
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
    marginBottom: 20,
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
