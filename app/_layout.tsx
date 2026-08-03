import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { PasscodeGate } from "@/components/PasscodeGate";
import { MorePaneHost } from "@/components/shell/MorePaneHost";
import { SearchModalHost } from "@/components/shell/SearchModalHost";
import { ShellFrame } from "@/components/shell/ShellFrame";
import { getDb } from "@/db/client";
import { log } from "@/lib/logger";
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
  const remindHour = useSettingsStore((s) => s.remindHour);
  const remindMinute = useSettingsStore((s) => s.remindMinute);
  const uiMode = useSettingsStore((s) => s.uiMode);

  const [dbReady, setDbReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await getDb();
      await hydrate();
      log.info("App boot complete");
      if (!cancelled) {
        setBootError(null);
        setDbReady(true);
      }
    })().catch((err) => {
      console.error("Failed to boot database", err);
      log.error("App boot failed", err);
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
    maybeFireDailyRemind(remindEveryday, remindHour, remindMinute);
    const id = setInterval(
      () => maybeFireDailyRemind(remindEveryday, remindHour, remindMinute),
      60_000,
    );
    return () => clearInterval(id);
  }, [dbReady, hydrated, remindEveryday, remindHour, remindMinute]);

  const ready = dbReady && hydrated;
  const locked = ready && passcodeEnabled && !sessionUnlocked;
  const statusStyle = uiMode === "light" ? "dark" : "light";

  /** Web More/App screens: centered dialog over the shell (not full-bleed). */
  const webDialogOptions =
    Platform.OS === "web"
      ? {
          presentation: "transparentModal" as const,
          animation: "fade" as const,
          contentStyle: { backgroundColor: "transparent" },
        }
      : { animation: "slide_from_right" as const };

  // Always mount Stack so the URL (/preferences etc.) is handled.
  // Overlays cover boot / passcode — never replace the navigator (that caused
  // expo-router onUnhandledAction crashes after theme reload).
  return (
    <GestureHandlerRootView style={styles.root}>
      <ShellFrame>
        <StatusBar style={statusStyle} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ animation: "fade" }} />
          <Stack.Screen name="more" options={webDialogOptions} />
          <Stack.Screen name="import-csv" options={webDialogOptions} />
          <Stack.Screen name="export-csv" options={webDialogOptions} />
          <Stack.Screen name="preferences" options={webDialogOptions} />
          <Stack.Screen name="data" options={webDialogOptions} />
          <Stack.Screen name="backup" options={webDialogOptions} />
          <Stack.Screen name="help" options={webDialogOptions} />
          <Stack.Screen name="about-doc" options={webDialogOptions} />
          <Stack.Screen name="reset" options={webDialogOptions} />
          <Stack.Screen name="account/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="category/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen
            name="record/new"
            options={{
              // Web: overlay dialog (transparent). Native: full-screen sheet.
              presentation: Platform.OS === "web" ? "transparentModal" : "modal",
              animation: Platform.OS === "web" ? "fade" : "slide_from_bottom",
              contentStyle:
                Platform.OS === "web"
                  ? { backgroundColor: "transparent" }
                  : { backgroundColor: colors.background },
            }}
          />
        </Stack>

        <MorePaneHost />
        <SearchModalHost />

        {!ready ? (
          <View style={[styles.overlay, styles.overlayCentered]} pointerEvents="auto">
            <ActivityIndicator color={colors.accent} size="large" />
            {bootError ? (
              <>
                <Text style={styles.errorTitle}>Could not start local database</Text>
                <Text style={styles.errorBody}>{bootError}</Text>
                <Text style={styles.errorHint}>
                  On web: close every other tab on localhost:8081 (SQLite OPFS allows
                  only one tab), then hard-refresh. Prefer a normal Chrome/Edge window
                  (not private/incognito).
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {locked ? (
          <View style={styles.overlay} pointerEvents="auto">
            <PasscodeGate onUnlocked={() => setSessionUnlocked(true)} />
          </View>
        ) : null}
      </ShellFrame>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    zIndex: 100,
  },
  overlayCentered: {
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
