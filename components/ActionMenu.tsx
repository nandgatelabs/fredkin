import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useKeydown } from "@/hooks/useKeydown";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

export type ActionMenuItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  title?: string;
  items: ActionMenuItem[];
  onClose: () => void;
};

export function ActionMenu({ visible, title, items, onClose }: Props) {
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {items.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.item,
                webClickable,
                pressed && styles.itemPressed,
              ]}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Text style={[styles.itemLabel, item.destructive && styles.destructive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [
              styles.item,
              webClickable,
              pressed && styles.itemPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
  },
  title: {
    color: colors.accentMuted,
    textAlign: "center",
    paddingVertical: 14,
    fontSize: 13,
    fontWeight: "600",
  },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  itemPressed: {
    backgroundColor: colors.accentSoft,
  },
  itemLabel: {
    color: colors.accent,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  destructive: {
    color: colors.danger,
  },
  cancel: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 16,
  },
});
