import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ITEMS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}[] = [
  { label: "Preferences", icon: "settings-outline", href: "/preferences" },
  { label: "Export CSV", icon: "download-outline", href: "/export-csv" },
  { label: "Import CSV", icon: "cloud-upload-outline", href: "/import-csv" },
  { label: "Backup & Restore", icon: "archive-outline", href: "/backup" },
  { label: "Delete & Reset", icon: "trash-outline", href: "/reset" },
];

export function AppDrawer({ visible, onClose }: Props) {
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
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={[styles.panel, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.brand}>money-money</Text>
          <Text style={styles.sub}>Local · offline · no paywall</Text>
          <View style={styles.list}>
            {ITEMS.map((item, index) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityHint={`Menu item ${index + 1} of ${ITEMS.length}`}
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
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    maxWidth: "82%",
    backgroundColor: colors.surfaceElevated,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 18,
  },
  brand: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: "600",
    fontStyle: "italic",
    fontFamily: webFontDisplay,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  list: { gap: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemPressed: {
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  itemLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
