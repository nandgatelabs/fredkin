import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { exportCsvFileName, exportMoneyCsv } from "@/db/exportCsv";
import { useKeydown } from "@/hooks/useKeydown";
import { SaveCancelledError, saveProducedTextFile } from "@/lib/download";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

export default function ExportCsvScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !busy) router.back();
      },
      [busy, router],
    ),
  );

  async function onExport() {
    // No setState before the picker — keeps the click as a user activation.
    const suggestedName = exportCsvFileName();
    let accountOpenings = 0;
    let records = 0;

    try {
      const saved = await saveProducedTextFile(
        suggestedName,
        "text/csv",
        async () => {
          setBusy(true);
          const result = await exportMoneyCsv();
          accountOpenings = result.accountOpenings;
          records = result.records;
          return result.text;
        },
      );

      setError(null);
      setSummary(
        `Saved ${suggestedName}\n${accountOpenings} account opening balance${accountOpenings === 1 ? "" : "s"}, ${records} record${records === 1 ? "" : "s"}.${
          saved.method === "download"
            ? "\n(Browser saved via Downloads — use Chrome/Edge for a folder picker.)"
            : ""
        }`,
      );
    } catch (e) {
      if (e instanceof SaveCancelledError) return;
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
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
        <Text style={styles.title}>Export CSV</Text>
        <View style={{ width: 64 }} />
      </View>

      <Text style={styles.body}>
        Save your ledger as a worksheet CSV (TIME, TYPE, AMOUNT, CATEGORY,
        ACCOUNT, NOTES). You’ll choose the folder and file name in the save
        dialog.
      </Text>
      <Text style={styles.body}>
        Each account’s initial (opening) balance is written as a{" "}
        <Text style={styles.em}>(#) Opening</Text> row so a later import can restore
        it.
      </Text>

      <Button
        label={busy ? "EXPORTING…" : "EXPORT NOW"}
        variant="primary"
        onPress={() => void onExport()}
        busy={busy}
        style={{ marginTop: 12 }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
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
    marginBottom: 12,
  },
  em: {
    color: colors.accent,
    fontWeight: "600",
  },
  error: {
    color: colors.danger,
    marginTop: 14,
    fontSize: 13,
  },
  summary: {
    color: colors.text,
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
});
