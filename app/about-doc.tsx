import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
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
  const insets = useSafeAreaInsets();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const isLicense = kind === "license";
  const title = isLicense ? "License" : "Privacy";
  const body = useMemo(() => (isLicense ? LICENSE : PRIVACY), [isLicense]);

  return (
    <WebCenterFrame>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
      >
        <WebDialogHeader title={title} />
        <Text style={styles.body} selectable>
          {body}
        </Text>
      </ScrollView>
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
});
