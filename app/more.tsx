import { Platform, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";

import { MoreMenu } from "@/components/more/MoreMenu";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { colors } from "@/theme";

/**
 * Web: More as a stack dialog so Settings/Data Back fades to this menu
 * (no remount glitch). Native uses the edge drawer via MorePaneHost.
 */
export default function MoreScreen() {
  if (Platform.OS !== "web") {
    return <Redirect href="/" />;
  }

  return (
    <WebCenterFrame>
      <View style={styles.screen}>
        <MoreMenu />
      </View>
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
