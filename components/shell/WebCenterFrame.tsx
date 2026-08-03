import type { ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import {
  WEB_DIALOG_HEIGHT_FRAC,
  WEB_DIALOG_WIDTH_FRAC,
  dismissWebDialog,
} from "@/lib/webDialog";
import { colors } from "@/theme";

type Props = {
  children: ReactNode;
};

/**
 * Web: wrap a stack screen in a centered dialog.
 * Native: pass-through.
 */
export function WebCenterFrame({ children }: Props) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const cardW = Math.round(width * WEB_DIALOG_WIDTH_FRAC);
  const cardH = Math.round(height * WEB_DIALOG_HEIGHT_FRAC);

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => dismissWebDialog(router)}
        accessibilityLabel="Back"
      />
      <View
        style={[
          styles.card,
          {
            width: cardW,
            height: cardH,
          },
        ]}
        // Keep presses inside the card from hitting the backdrop.
        onStartShouldSetResponder={() => true}
      >
        {children}
      </View>
    </View>
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
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
});
