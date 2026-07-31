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
import { importMoneyCsv, type ImportMode, type ImportResult } from "@/db/importCsv";
import { useKeydown } from "@/hooks/useKeydown";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

export default function ImportCsvScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ImportMode>("replace");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !busy) router.back();
      },
      [busy, router],
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

  async function pickFile() {
    setError(null);
    setResult(null);

    if (Platform.OS === "web") {
      await pickWebFile(runImport, (msg) => setError(msg));
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
    await runImport(text, asset.name ?? "export.csv");
  }

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
        Load a money-money / MyMoney worksheet export with columns TIME, TYPE,
        AMOUNT, CATEGORY, ACCOUNT, NOTES. Accounts and categories are created
        automatically when missing.
      </Text>

      <Text style={styles.label}>Mode</Text>
      <View style={styles.modeRow}>
        <ModeChip
          label="REPLACE records"
          selected={mode === "replace"}
          onPress={() => setMode("replace")}
        />
        <ModeChip
          label="APPEND"
          selected={mode === "append"}
          onPress={() => setMode("append")}
        />
      </View>
      <Text style={styles.hint}>
        Replace deletes existing records first (recommended when migrating a full
        export). Append keeps current records and adds imported rows.
      </Text>

      <Button
        label={busy ? "IMPORTING…" : "CHOOSE CSV FILE"}
        variant="primary"
        onPress={() => void pickFile()}
        busy={busy}
        style={{ marginTop: 20 }}
      />

      {fileName ? <Text style={styles.file}>File: {fileName}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Import finished</Text>
          <Text style={styles.resultLine}>Imported: {result.imported}</Text>
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
    </View>
  );
}

function ModeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, webClickable, selected && styles.chipOn]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
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
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.inputBg,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.12)",
  },
  chipLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  chipLabelOn: {
    color: colors.accent,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
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
