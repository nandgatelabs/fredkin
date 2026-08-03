import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DatePickerModal } from "@/components/DateTimePickers";
import { Button } from "@/components/ui/Button";
import { InfoModal } from "@/components/InfoModal";
import { SaveLocationPanel } from "@/components/SaveLocationPanel";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import { exportMoneyCsv } from "@/db/exportCsv";
import { formatComposerDate } from "@/lib/datetime";
import { downloadTextFile } from "@/lib/download";
import { log } from "@/lib/logger";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Bound = "from" | "to" | null;

function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0);
}

function todayNoon(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

export default function ExportCsvScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [from, setFrom] = useState<Date | null>(monthStart());
  const [to, setTo] = useState<Date | null>(todayNoon());
  const [picking, setPicking] = useState<Bound>(null);

  async function onExport() {
    if (from && to && startKey(from) > startKey(to)) {
      setError("From date must be on or before To date");
      return;
    }
    setBusy(true);
    setError(null);
    setSummary(null);
    log.info("CSV export start", {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    });
    try {
      const result = await exportMoneyCsv({ from, to });
      const saved = await downloadTextFile(result.fileName, result.text, "text/csv");
      log.info("CSV export complete", saved.locationLabel);
      setSummary(
        `Saved ${result.fileName}\nLocation: ${saved.locationLabel}\nRange: ${result.fromLabel} → ${result.toLabel}\n${result.accountOpenings} account opening balance${result.accountOpenings === 1 ? "" : "s"}, ${result.records} record${result.records === 1 ? "" : "s"}.`,
      );
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      log.error("CSV export failed", e);
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WebCenterFrame>
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerPad}>
        <WebDialogHeader
          title="Export CSV"
          escapeBack={!busy && picking == null && error == null && summary == null}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.body}>
          Download your ledger as a worksheet CSV (TIME, TYPE, AMOUNT, CATEGORY,
          ACCOUNT, NOTES).
        </Text>
        <Text style={styles.body}>
          Each account’s initial (opening) balance is written as a{" "}
          <Text style={styles.em}>(#) Opening</Text> row so a later import can restore
          it. Record rows respect the From / To range below.
        </Text>

        <View style={styles.rangeCard}>
          <Text style={styles.rangeTitle}>Date range</Text>
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
          <View style={styles.rangeActions}>
            <Pressable
              style={[styles.chip, webClickable]}
              onPress={() => {
                setFrom(monthStart());
                setTo(todayNoon());
              }}
            >
              <Text style={styles.chipLabel}>This month</Text>
            </Pressable>
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
        </View>

        <SaveLocationPanel />

        <Button
          label={busy ? "EXPORTING…" : "EXPORT NOW"}
          variant="primary"
          onPress={() => void onExport()}
          busy={busy}
          style={{ marginTop: 12 }}
        />
      </ScrollView>

      <DatePickerModal
        visible={picking != null}
        value={
          picking === "from"
            ? (from ?? monthStart())
            : (to ?? todayNoon())
        }
        onCancel={() => setPicking(null)}
        onConfirm={(next) => {
          if (picking === "from") setFrom(next);
          if (picking === "to") setTo(next);
          setPicking(null);
        }}
      />

      <InfoModal
        visible={error != null || summary != null}
        title={error ? "Export failed" : "Export CSV"}
        message={error ?? summary ?? ""}
        onClose={() => {
          setError(null);
          setSummary(null);
        }}
      />
    </View>
    </WebCenterFrame>
  );
}

function startKey(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
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
    marginBottom: 12,
  },
  em: {
    color: colors.accent,
    fontWeight: "600",
  },
  rangeCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    gap: 10,
  },
  rangeTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
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
  rangeActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
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
});
