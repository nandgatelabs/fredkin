import { Modal, Pressable, StyleSheet, View } from "react-native";

import { GlassSurface } from "@/components/GlassSurface";
import { SearchBody } from "@/components/search/SearchBody";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Centered ~50% search dialog (web desktop). */
export function SearchModal({ visible, onClose }: Props) {
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
          <GlassSurface elevated style={styles.card}>
            <SearchBody compact onClose={onClose} />
          </GlassSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardWrap: {
    width: "50%",
    minWidth: 380,
    maxWidth: 720,
    height: "50%",
    minHeight: 360,
    maxHeight: 640,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    overflow: "hidden",
  },
});
