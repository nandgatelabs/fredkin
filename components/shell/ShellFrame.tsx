import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

import { colors } from "@/theme";

type Props = { children: ReactNode };

/** Native: full-bleed shell (no column constraint). */
export function ShellFrame({ children }: Props) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
