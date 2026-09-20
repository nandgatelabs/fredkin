import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { DatePickerModal } from "@/components/DateTimePickers";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import { importMoneyCsv, type ImportMode, type ImportResult } from "@/db/importCsv";
import { formatComposerDate } from "@/lib/datetime";
import { log } from "@/lib/logger";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type PendingFile = { text: string; name: string };
type Bound = "from" | "to" | null;

export default function ImportCsvScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ImportMode>("replace");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [picking, setPicking] = useState<Bound>(null);

  async function runImport(text: string, name: string) {
    if (from && to && startKey(from) > startKey(to)) {
      setError("From date must be on or before To date");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setFileName(name);
    log.debug("ui import run", { name, mode });
    try {
      const res = await importMoneyCsv(text, mode, { from, to });
      setResult(res);
    } catch (e) {
      log.error("CSV import failed", e);
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

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

  const rangeLabel =
    from || to
      ? `${from ? formatComposerDate(from) : "…"} → ${to ? formatComposerDate(to) : "…"}`
      : "All dates in the file";

  const confirmTitle =
    mode === "replace" ? "Override with CSV?" : "Append to existing data?";
  const confirmMessage =
    mode === "replace"
      ? `Override with rows from “${pending?.name ?? "this file"}” (${rangeLabel})? Existing records, accounts, and categories will be deleted first. Opening-balance rows still apply.`
      : `Add in-range rows from “${pending?.name ?? "this file"}” (${rangeLabel}) on top of your current records? Duplicate rows are possible if you import the same file twice.`;

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
        title="Import CSV"
        escapeBack={!busy && pending == null && picking == null}
      />

      <Text style={styles.body}>
        Load a worksheet export with columns TIME, TYPE, AMOUNT, CATEGORY,
        ACCOUNT, NOTES (optional PERSON, PERSON_ROLE, OCCASION).
        `(~+) Adjustment` / `(~-) Adjustment` rows restore wallet-check absorbs.
        Rows typed `(#) Opening` restore each account’s initial balance (Fredkin
        extension).
      </Text>

      <Text style={styles.label}>What should happen to existing data?</Text>
      <ModeOption
        title="Override — keep only this CSV"
        description="Deletes current records, accounts, and categories, then loads in-range rows. Use for a full migration."
        selected={mode === "replace"}
        onPress={() => setMode("replace")}
      />
      <ModeOption
        title="Append — add to existing data"
        description="Keeps everything you already have and adds in-range imported rows. Can create duplicates."
        selected={mode === "append"}
        onPress={() => setMode("append")}
      />

      <View style={styles.rangeCard}>
        <Text style={styles.rangeTitle}>Import date range</Text>
        <Text style={styles.rangeHint}>
          Only record rows whose TIME falls in this range are imported. Leave both
          as All time to import every row. Opening-balance rows always apply.
        </Text>
        <View style={styles.rangeRow}>
          <Pressable
            style={[styles.rangeBtn, webClickable]}
            onPress={() => setPicking("from")}
            {...webFocusableProps}
          >
            <Text style={styles.rangeLabel}>From</Text>
            <Text style={styles.rangeValue}>
              {from ? formatComposerDate(from) : "All time"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.rangeBtn, webClickable]}
            onPress={() => setPicking("to")}
            {...webFocusableProps}
          >
            <Text style={styles.rangeLabel}>To</Text>
            <Text style={styles.rangeValue}>
              {to ? formatComposerDate(to) : "All time"}
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.chip, webClickable]}
          onPress={() => {
            setFrom(null);
            setTo(null);
          }}
        >
          <Text style={styles.chipLabel}>All time</Text>
        </Pressable>
      </View>

      <Button
        label={busy ? "IMPORTING…" : "CHOOSE CSV FILE"}
        variant="primary"
        onPress={() => void pickFile()}
        busy={busy}
        style={{ marginTop: 8 }}
      />

      {fileName && !result ? <Text style={styles.file}>File: {fileName}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Import finished</Text>
          <Text style={styles.resultLine}>
            Mode: {mode === "replace" ? "Override (CSV only)" : "Append"}
          </Text>
          <Text style={styles.resultLine}>Range: {rangeLabel}</Text>
          <Text style={styles.resultLine}>Imported: {result.imported}</Text>
          <Text style={styles.resultLine}>
            Opening balances applied: {result.openingsApplied}
          </Text>
          <Text style={styles.resultLine}>
            Skipped (out of range): {result.skippedOutOfRange}
          </Text>
          <Text style={styles.resultLine}>Skipped (errors): {result.skipped}</Text>
          <Text style={styles.resultLine}>
            Wallets created: {result.accountsCreated}
          </Text>
          <Text style={styles.resultLine}>
            Event types created: {result.categoriesCreated}
          </Text>
          <Text style={styles.resultLine}>
            People created: {result.peopleCreated}
          </Text>
          <Text style={styles.resultLine}>
            Occasions created: {result.occasionsCreated}
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

      <DatePickerModal
        visible={picking != null}
        value={
          picking === "from"
            ? (from ?? new Date())
            : (to ?? new Date())
        }
        onCancel={() => setPicking(null)}
        onConfirm={(next) => {
          if (picking === "from") setFrom(next);
          if (picking === "to") setTo(next);
          setPicking(null);
        }}
      />

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
      </ScrollView>
    </WebCenterFrame>
  );
}

function startKey(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
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
  rangeCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: colors.surface,
    gap: 10,
  },
  rangeTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  rangeHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  rangeRow: { flexDirection: "row", gap: 10 },
  rangeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceElevated,
  },
  rangeLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  rangeValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  chip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
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
    backgroundColor: colors.accentSoft,
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
