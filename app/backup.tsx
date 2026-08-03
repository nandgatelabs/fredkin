import { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { InfoModal } from "@/components/InfoModal";
import { SaveLocationPanel } from "@/components/SaveLocationPanel";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import {
  backupFileName,
  createBackupPayload,
  restoreBackupPayload,
  type MoneyBackup,
} from "@/db/backup";
import { formatComposerDate, formatComposerTime } from "@/lib/datetime";
import { downloadTextFile } from "@/lib/download";
import { log } from "@/lib/logger";
import {
  listBackupFiles,
  type BackupFileInfo,
} from "@/lib/saveLocation";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<MoneyBackup | null>(null);
  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [listHint, setListHint] = useState<string | null>(null);

  const reloadList = useCallback(async () => {
    try {
      const files = await listBackupFiles();
      setBackups(files);
      if (files.length === 0) {
        setListHint(
          Platform.OS === "web"
            ? "No .mbak files in the chosen save folder yet. Change folder above, or pick a file."
            : "No .mbak files in the save folder yet. Back up now, or restore from file.",
        );
      } else {
        setListHint(null);
      }
    } catch (e) {
      log.warn("listBackupFiles failed", e);
      setBackups([]);
      setListHint("Could not list backups in the save folder. Use Restore from file.");
    }
  }, []);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  async function onBackup() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload = await createBackupPayload();
      const name = backupFileName();
      const saved = await downloadTextFile(
        name,
        JSON.stringify(payload, null, 2),
        "application/json",
      );
      log.info("Backup complete", saved.locationLabel);
      setMessage(
        `Backup saved as ${name}\nLocation: ${saved.locationLabel}\n(${payload.records.length} records, ${payload.accounts.length} accounts).`,
      );
      await reloadList();
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      log.error("Backup failed", e);
      setError(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setBusy(false);
    }
  }

  async function prepareRestore(text: string, name: string) {
    const parsed = JSON.parse(text) as MoneyBackup;
    if (parsed.version !== 1) throw new Error("Not a Fredkin v1 backup");
    setPendingRestore(parsed);
    setMessage(`Ready to restore ${name}`);
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
      await prepareRestore(text, name);
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      setError(e instanceof Error ? e.message : "Could not read backup");
    }
  }

  return (
    <WebCenterFrame>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
      <WebDialogHeader
        title="Backup"
        escapeBack={
          !busy && pendingRestore == null && error == null && message == null
        }
      />

      <Text style={styles.body}>
        A `.mbak` file is a full local snapshot: accounts, categories, records,
        budgets, and settings. Prefer this over CSV when you want a complete restore.
      </Text>

      <SaveLocationPanel
        onStatus={() => {
          void reloadList();
        }}
      />

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

      <View style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Backups in save folder</Text>
          <Pressable onPress={() => void reloadList()} style={webClickable}>
            <Text style={styles.refresh}>Refresh</Text>
          </Pressable>
        </View>
        {listHint ? <Text style={styles.listHint}>{listHint}</Text> : null}
        {backups.map((file) => (
          <Pressable
            key={`${file.name}-${file.modifiedAt?.getTime() ?? 0}`}
            disabled={busy}
            style={[styles.fileRow, webClickable, busy && styles.disabled]}
            onPress={() => {
              void (async () => {
                setBusy(true);
                setError(null);
                try {
                  const text = await file.readText();
                  await prepareRestore(text, file.name);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not read backup");
                } finally {
                  setBusy(false);
                }
              })();
            }}
            {...webFocusableProps}
          >
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.fileMeta}>
              {file.modifiedAt
                ? `${formatComposerDate(file.modifiedAt)} ${formatComposerTime(file.modifiedAt)}`
                : "Unknown date"}
            </Text>
          </Pressable>
        ))}
      </View>

      <InfoModal
        visible={error != null || message != null}
        title={error ? "Backup" : "Backup & Restore"}
        message={error ?? message ?? ""}
        onClose={() => {
          setError(null);
          setMessage(null);
        }}
      />

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
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  listCard: {
    marginTop: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
    gap: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  refresh: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
  listHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  fileRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceElevated,
  },
  fileName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  disabled: { opacity: 0.5 },
});
