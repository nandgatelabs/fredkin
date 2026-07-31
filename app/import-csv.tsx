import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { importMoneyCsv, type ImportMode, type ImportResult } from "@/db/importCsv";
import { useKeydown } from "@/hooks/useKeydown";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type PendingFile = { text: string; name: string };

export default function ImportCsvScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ImportMode>("replace");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !busy && !pending) router.back();
      },
      [busy, pending, router],
    ),
  );

  async function runImport(text: string, name: string) {
    setBusy(true);
    setError(null);
    setResult(null);
    setFileName(name);
    try {
      const res = await importMoneyCsv(text, mode);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  /** Open the file picker immediately (must stay in the user-gesture chain on web). */
  async function pickFile() {
    setError(null);
    setResult(null);

    if (Platform.OS === "web") {
      await pickWebFile(
        (text, name) => {
          setPending({ text, name });
          setFileName(name);
          return Promise.resolve();
        },
        (msg) => setError(msg),
      );
      return;
    }

    const picked = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "text/comma-separated-values", "text/plain", "*/*"],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    const res = await fetch(asset.uri);
    const text = await res.text();
    const name = asset.name ?? "export.csv";
    setFileName(name);
    setPending({ text, name });
  }

  const confirmTitle =
    mode === "replace" ? "Override with CSV?" : "Append to existing data?";
  const confirmMessage =
    mode === "replace"
      ? `Override everything with “${pending?.name ?? "this file"}”? Existing records, accounts, and categories will be deleted. Only the imported file will remain.`
      : `Add every row from “${pending?.name ?? "this file"}” on top of your current records? Duplicate rows are possible if you import the same file twice.`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={webClickable}>
          <Text style={styles.back}>✕ CLOSE</Text>
        </Pressable>
        <Text style={styles.title}>Import CSV</Text>
        <View style={{ width: 64 }} />
      </View>

      <Text style={styles.body}>
        Load a worksheet export with columns TIME, TYPE, AMOUNT, CATEGORY,
        ACCOUNT, NOTES. Missing accounts and categories are created automatically.
        Rows typed `(#) Opening` restore each account’s initial balance (money-money
        extension).
      </Text>

      <Text style={styles.label}>What should happen to existing data?</Text>
      <ModeOption
        title="Override — keep only this CSV"
        description="Deletes current records, accounts, and categories, then loads the file. Use for a full migration."
        selected={mode === "replace"}
        onPress={() => setMode("replace")}
      />
      <ModeOption
        title="Append — add to existing data"
        description="Keeps everything you already have and adds imported rows. Can create duplicates."
        selected={mode === "append"}
        onPress={() => setMode("append")}
      />

      <Button
        label={busy ? "IMPORTING…" : "CHOOSE CSV FILE"}
        variant="primary"
        onPress={() => void pickFile()}
        busy={busy}
        style={{ marginTop: 20 }}
      />

      {fileName && !result ? <Text style={styles.file}>File: {fileName}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Import finished</Text>
          <Text style={styles.resultLine}>
            Mode: {mode === "replace" ? "Override (CSV only)" : "Append"}
          </Text>
          <Text style={styles.resultLine}>Imported: {result.imported}</Text>
          <Text style={styles.resultLine}>
            Opening balances applied: {result.openingsApplied}
          </Text>
          <Text style={styles.resultLine}>Skipped: {result.skipped}</Text>
          <Text style={styles.resultLine}>
            Accounts created: {result.accountsCreated}
          </Text>
          <Text style={styles.resultLine}>
            Categories created: {result.categoriesCreated}
          </Text>
          {result.errors.length > 0 ? (
            <Text style={styles.errorList}>{result.errors.join("\n")}</Text>
          ) : null}
          <Button
            label="VIEW RECORDS"
            variant="secondary"
            onPress={() => router.replace("/")}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : null}

      <ConfirmModal
        visible={pending != null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={mode === "replace" ? "Override" : "Append"}
        destructive={mode === "replace"}
        onCancel={() => {
          setPending(null);
          setFileName(null);
        }}
        onConfirm={() => {
          if (!pending) return;
          const file = pending;
          setPending(null);
          void runImport(file.text, file.name);
        }}
      />
    </View>
  );
}

function ModeOption({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, webClickable, selected && styles.optionOn]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.optionBody}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleOn]}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
    </Pressable>
  );
}

async function pickWebFile(
  onText: (text: string, name: string) => Promise<void>,
  onError: (msg: string) => void,
) {
  await new Promise<void>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        void onText(String(reader.result ?? ""), file.name).finally(resolve);
      };
      reader.onerror = () => {
        onError("Could not read file");
        resolve();
      };
      reader.readAsText(file);
    };
    input.oncancel = () => resolve();
    input.click();
  });
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
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  label: {
    color: colors.accent,
    fontWeight: "600",
    marginBottom: 10,
  },
  option: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.inputBg,
    marginBottom: 10,
  },
  optionOn: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOn: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  optionBody: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  optionTitleOn: {
    color: colors.accent,
  },
  optionDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  file: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 14,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    fontSize: 13,
  },
  result: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    gap: 4,
  },
  resultTitle: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 6,
  },
  resultLine: {
    color: colors.text,
    fontSize: 14,
  },
  errorList: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 16,
  },
});
