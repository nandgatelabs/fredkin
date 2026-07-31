import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { PasscodeGate } from "@/components/PasscodeGate";
import { getDb } from "@/db/client";
import { maybeFireDailyRemind } from "@/lib/remind";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const passcodeEnabled = useSettingsStore((s) => s.passcodeEnabled);
  const sessionUnlocked = useSettingsStore((s) => s.sessionUnlocked);
  const setSessionUnlocked = useSettingsStore((s) => s.setSessionUnlocked);
  const remindEveryday = useSettingsStore((s) => s.remindEveryday);
  const uiMode = useSettingsStore((s) => s.uiMode);

  const [dbReady, setDbReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await getDb();
      await hydrate();
      if (!cancelled) {
        setBootError(null);
        setDbReady(true);
      }
    })().catch((err) => {
      console.error("Failed to boot database", err);
      if (!cancelled) {
        setBootError(err instanceof Error ? err.message : String(err));
        setDbReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  useEffect(() => {
    if (!dbReady || !hydrated) return;
    maybeFireDailyRemind(remindEveryday);
    const id = setInterval(() => maybeFireDailyRemind(remindEveryday), 60_000);
    return () => clearInterval(id);
  }, [dbReady, hydrated, remindEveryday]);

  if (!dbReady || !hydrated) {
    return (
      <View style={styles.boot}>
        <StatusBar style={uiMode === "light" ? "dark" : "light"} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={styles.boot}>
        <StatusBar style={uiMode === "light" ? "dark" : "light"} />
        <Text style={styles.errorTitle}>Could not start local database</Text>
        <Text style={styles.errorBody}>{bootError}</Text>
        <Text style={styles.errorHint}>
          On web: close every other tab on localhost:8081 (SQLite OPFS allows
          only one tab), then hard-refresh. Prefer a normal Chrome/Edge window
          (not private/incognito).
        </Text>
      </View>
    );
  }

  if (passcodeEnabled && !sessionUnlocked) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style={uiMode === "light" ? "dark" : "light"} />
        <PasscodeGate onUnlocked={() => setSessionUnlocked(true)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={uiMode === "light" ? "dark" : "light"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="search" options={{ animation: "fade" }} />
        <Stack.Screen name="import-csv" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="export-csv" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="preferences" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="backup" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="reset" options={{ animation: "slide_from_right" }} />
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
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    color: colors.expense,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  errorBody: {
    color: colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  errorHint: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
