import { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  backupFileName,
  createBackupPayload,
  restoreBackupPayload,
  type MoneyBackup,
} from "@/db/backup";
import { useKeydown } from "@/hooks/useKeydown";
import { downloadTextFile } from "@/lib/download";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

export default function BackupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<MoneyBackup | null>(null);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !busy) router.back();
      },
      [busy, router],
    ),
  );

  async function onBackup() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload = await createBackupPayload();
      const name = backupFileName();
      await downloadTextFile(
        name,
        JSON.stringify(payload, null, 2),
        "application/json",
      );
      setMessage(
        `Backup saved as ${name} (${payload.records.length} records, ${payload.accounts.length} accounts).`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setBusy(false);
    }
  }

  async function pickRestore() {
    setError(null);
    setMessage(null);
    try {
      let text = "";
      let name = "backup.mbak";
      if (Platform.OS === "web") {
        text = await new Promise<string>((resolve, reject) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".mbak,application/json,.json";
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) {
              reject(new Error("cancelled"));
              return;
            }
            name = file.name;
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error("Could not read file"));
            reader.readAsText(file);
          };
          input.oncancel = () => reject(new Error("cancelled"));
          input.click();
        });
      } else {
        const picked = await DocumentPicker.getDocumentAsync({
          type: ["application/json", "*/*"],
          copyToCacheDirectory: true,
        });
        if (picked.canceled || !picked.assets?.[0]) return;
        name = picked.assets[0].name ?? name;
        text = await (await fetch(picked.assets[0].uri)).text();
      }
      const parsed = JSON.parse(text) as MoneyBackup;
      if (parsed.version !== 1) throw new Error("Not a money-money v1 backup");
      setPendingRestore(parsed);
      setMessage(`Ready to restore ${name}`);
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      setError(e instanceof Error ? e.message : "Could not read backup");
    }
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
      ]}
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
        <Text style={styles.title}>Backup</Text>
        <View style={{ width: 64 }} />
      </View>

      <Text style={styles.body}>
        A `.mbak` file is a full local snapshot: accounts, categories, records,
        budgets, and settings. Prefer this over CSV when you want a complete restore.
      </Text>

      <Button
        label={busy ? "WORKING…" : "BACKUP NOW"}
        variant="primary"
        onPress={() => void onBackup()}
        busy={busy}
        style={{ marginTop: 8 }}
      />
      <Button
        label="RESTORE FROM FILE"
        variant="secondary"
        onPress={() => void pickRestore()}
        busy={busy}
        style={{ marginTop: 12 }}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ConfirmModal
        visible={pendingRestore != null}
        title="Restore backup?"
        message="This replaces all current accounts, categories, records, budgets, and settings with the backup. This cannot be undone."
        confirmLabel="Restore"
        destructive
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => {
          if (!pendingRestore) return;
          const payload = pendingRestore;
          setPendingRestore(null);
          setBusy(true);
          void restoreBackupPayload(payload)
            .then(() => hydrate())
            .then(() => setMessage("Restore finished. Data reloaded."))
            .catch((e) =>
              setError(e instanceof Error ? e.message : "Restore failed"),
            )
            .finally(() => setBusy(false));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  back: { color: colors.accent, fontWeight: "600", fontSize: 13, width: 64 },
  title: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  message: { color: colors.text, marginTop: 16, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, marginTop: 12, fontSize: 13 },
});
