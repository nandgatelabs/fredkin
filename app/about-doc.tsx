import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

const PRIVACY = `Privacy

Fredkin by NandGateLabs is offline-first. Your ledger (wallets, event types, events, budgets, settings, passcode hash) stays on this device in local SQLite / OPFS storage.

• No accounts or cloud sync in v1
• No analytics or crash telemetry by default
• Optional local debug logs stay on-device; export them yourself if you need to share
• Backups and CSV exports are files you choose where to save

See SECURITY.md in the repository for how to report vulnerabilities privately.`;

const LICENSE = `MIT License

Copyright (c) 2026 Shivamrut <gshivamrut@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function AboutDocScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const isLicense = kind === "license";
  const title = isLicense ? "License" : "Privacy";
  const body = useMemo(() => (isLicense ? LICENSE : PRIVACY), [isLicense]);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape") router.back();
      },
      [router],
    ),
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={styles.back}>✕ CLOSE</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 64 }} />
      </View>
      <Text style={styles.body} selectable>
        {body}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  back: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
    width: 64,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
});
