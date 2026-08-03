import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { GlassSurface } from "@/components/GlassSurface";
import { SearchBody } from "@/components/search/SearchBody";
import {
  WEB_DIALOG_HEIGHT_FRAC,
  WEB_DIALOG_WIDTH_FRAC,
} from "@/lib/webDialog";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Centered search dialog (web desktop). */
export function SearchModal({ visible, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.round(width * WEB_DIALOG_WIDTH_FRAC);
  const cardH = Math.round(height * WEB_DIALOG_HEIGHT_FRAC);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Dismiss"
        />
        <View style={{ width: cardW, height: cardH, zIndex: 1 }}>
          <GlassSurface elevated style={styles.card}>
            <SearchBody compact onClose={onClose} />
          </GlassSurface>
        </View>
      </View>
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
  card: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    overflow: "hidden",
  },
});
