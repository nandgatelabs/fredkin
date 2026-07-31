import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { getDb } from "@/db/client";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await getDb();
      await hydrate();
      if (!cancelled) setDbReady(true);
    })().catch((err) => {
      console.error("Failed to boot database", err);
      if (!cancelled) setDbReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  if (!dbReady || !hydrated) {
    return (
      <View style={styles.boot}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="search" options={{ animation: "fade" }} />
        <Stack.Screen
          name="record/new"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
