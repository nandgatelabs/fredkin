import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlassSurface } from "@/components/GlassSurface";
import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ROWS: { keys: string; action: string }[] = [
  { keys: "⌘/Ctrl + K", action: "Search" },
  { keys: "/", action: "Search" },
  { keys: "M", action: "Open / close More" },
  { keys: "1–4", action: "In More: Settings / Data / Support / Reset" },
  { keys: "N", action: "New event" },
  { keys: "S", action: "Toggle split view" },
  { keys: "← / →", action: "Previous / next period" },
  { keys: "1", action: "Events (outside More)" },
  { keys: "2", action: "Insights (outside More)" },
  { keys: "3", action: "Wallets (outside More)" },
  { keys: "4", action: "Event types (outside More)" },
  { keys: "?", action: "This shortcuts list" },
  { keys: "Esc", action: "Back (or close More / search)" },
];

export function KeyboardShortcutsModal({ visible, onClose }: Props) {
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.cardWrap}
          onPress={(e) => e.stopPropagation?.()}
        >
          <GlassSurface style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Keyboard shortcuts</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={10}
                {...webFocusableProps}
                style={webClickable}
              >
                <Ionicons name="close" size={22} color={colors.accent} />
              </Pressable>
            </View>
            {ROWS.map((row) => (
              <View key={row.keys} style={styles.row}>
                <Text style={styles.keys}>{row.keys}</Text>
                <Text style={styles.action}>{row.action}</Text>
              </View>
            ))}
          </GlassSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 420,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  keys: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  action: {
    color: colors.textSecondary,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
});
