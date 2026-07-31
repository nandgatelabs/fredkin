import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {items.map((item) => (
            <Pressable
              key={item.label}
              style={styles.item}
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
          <Pressable style={styles.item} onPress={onClose}>
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  title: {
    color: colors.accentMuted,
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 13,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemLabel: {
    color: colors.accent,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
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
