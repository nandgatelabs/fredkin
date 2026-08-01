import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useKeydown } from "@/hooks/useKeydown";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
};

/** Single-button alert dialog for status / validation messages. */
export function InfoModal({
  visible,
  title = "money-money",
  message,
  confirmLabel = "OK",
  onClose,
}: Props) {
  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape" || event.key === "Enter") {
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
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button label={confirmLabel} variant="primary" onPress={onClose} style={styles.btn} />
          </View>
        </Pressable>
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
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
    maxWidth: layout.dialogMaxWidth,
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  btn: {
    minWidth: 96,
  },
});
