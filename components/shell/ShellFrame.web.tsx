import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

import { colors } from "@/theme";

type Props = { children: ReactNode };

/**
 * Web shell: full-bleed viewport for desktop split home.
 * (Narrow-width single-pane fallback can reintroduce a max width later.)
 */
export function ShellFrame({ children }: Props) {
  return <View style={styles.viewport}>{children}</View>;
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },
});
