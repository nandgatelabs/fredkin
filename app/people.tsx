import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PeoplePane } from "@/components/people/PeoplePane";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import { colors } from "@/theme";

export default function PeopleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <WebCenterFrame>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom },
        ]}
      >
        <WebDialogHeader title="People" />
        <PeoplePane
          onOpenPerson={(id) => router.push(`/person/${id}` as never)}
        />
      </View>
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
