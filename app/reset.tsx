import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import { wipeData, type WipeMode } from "@/db/backup";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

const OPTIONS: {
  mode: WipeMode;
  title: string;
  body: string;
  confirm: string;
}[] = [
  {
    mode: "records",
    title: "Delete all events",
    body: "Removes every spend, income, and transfer. Wallets, event types, and budgets stay.",
    confirm: "Delete events",
  },
  {
    mode: "all_data",
    title: "Delete all",
    body: "Removes events, wallets, event types, and budgets. Settings stay.",
    confirm: "Delete all",
  },
  {
    mode: "factory",
    title: "Reset all",
    body: "Factory reset: wipe ledger data and settings. Next launch reseeds defaults.",
    confirm: "Reset all",
  },
];

export default function ResetScreen() {
  const insets = useSafeAreaInsets();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [pending, setPending] = useState<(typeof OPTIONS)[number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <WebCenterFrame>
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerPad}>
          <WebDialogHeader title="Reset" escapeBack={!busy && pending == null} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Text style={styles.body}>
            Destructive actions. Export or backup first if you might need the data later.
          </Text>

          {OPTIONS.map((opt) => (
            <View key={opt.mode} style={styles.card}>
              <Text style={styles.cardTitle}>{opt.title}</Text>
              <Text style={styles.cardBody}>{opt.body}</Text>
              <Button
                label={opt.confirm.toUpperCase()}
                variant="danger"
                onPress={() => setPending(opt)}
                style={{ marginTop: 10 }}
              />
            </View>
          ))}

          {message ? <Text style={styles.message}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <ConfirmModal
          visible={pending != null}
          title={pending?.title ?? ""}
          message={pending ? `${pending.body} This cannot be undone.` : ""}
          confirmLabel={pending?.confirm ?? "Confirm"}
          destructive
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (!pending) return;
            const mode = pending.mode;
            setPending(null);
            setBusy(true);
            setError(null);
            void wipeData(mode)
              .then(async () => {
                if (mode === "factory") await hydrate();
                setMessage(
                  mode === "factory"
                    ? "Reset complete. Restart or refresh if seed data should reload."
                    : "Done.",
                );
              })
              .catch((e) => setError(e instanceof Error ? e.message : "Wipe failed"))
              .finally(() => setBusy(false));
          }}
        />
      </View>
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerPad: {
    paddingHorizontal: 20,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
    marginBottom: 12,
    gap: 6,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
  cardBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  message: { color: colors.text, marginTop: 8, fontSize: 14 },
  error: { color: colors.danger, marginTop: 8, fontSize: 13 },
});
