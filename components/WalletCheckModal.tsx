import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { DatePickerModal, TimePickerModal } from "@/components/DateTimePickers";
import { useKeydown } from "@/hooks/useKeydown";
import {
  formatComposerDate,
  formatComposerTime,
} from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { webClickable } from "@/lib/web";
import {
  isTinyWalletGap,
  walletGap,
} from "@/lib/walletCheck";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  visible: boolean;
  walletName: string;
  appBalance: number;
  onClose: () => void;
  onSave: (input: { realBalance: number; asOf: Date; absorb: boolean }) => Promise<void>;
  onAddMissing: (input: { realBalance: number; asOf: Date; gap: number }) => Promise<void>;
};

export function WalletCheckModal({
  visible,
  walletName,
  appBalance,
  onClose,
  onSave,
  onAddMissing,
}: Props) {
  const [realText, setRealText] = useState("");
  const [asOf, setAsOf] = useState(() => new Date());
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setRealText(String(appBalance));
    setAsOf(new Date());
    setError(null);
    setBusy(false);
  }, [visible, appBalance]);

  const realBalance = Number(realText.replace(/,/g, ""));
  const realOk = realText.trim() !== "" && !Number.isNaN(realBalance);
  const gap = realOk ? walletGap(appBalance, realBalance) : 0;
  const aligned = realOk && Math.abs(gap) < 0.005;
  const tiny = realOk && isTinyWalletGap(gap);

  const hint = useMemo(() => {
    if (!realOk || aligned) return "Ledger matches this count.";
    if (tiny) return "Small cash gap — Absorb is fine.";
    return "Prefer adding the missing events. Absorb only if you cannot reconstruct them.";
  }, [aligned, realOk, tiny]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      if (!realOk) {
        setError("Enter the real balance");
        return;
      }
      try {
        setBusy(true);
        setError(null);
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Check failed");
        setBusy(false);
      }
    },
    [realOk],
  );

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onClose();
        }
      },
      [busy, onClose],
    ),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={() => !busy && onClose()}>
        <Pressable
          style={[styles.card, Platform.OS === "web" && styles.webCard]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>Check {walletName}</Text>
          <Text style={styles.sub}>Count cash or the bank app, then compare.</Text>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>App</Text>
            <Text style={styles.statValue}>{formatMoney(appBalance, { sign: "auto" })}</Text>
          </View>

          <Text style={styles.fieldLabel}>Real balance</Text>
          <TextInput
            style={styles.input}
            value={realText}
            onChangeText={setRealText}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.asOfRow}>
            <Pressable
              onPress={() => setDateOpen(true)}
              style={[styles.asOfBtn, webClickable]}
            >
              <Text style={styles.asOfText}>{formatComposerDate(asOf)}</Text>
            </Pressable>
            <Pressable
              onPress={() => setTimeOpen(true)}
              style={[styles.asOfBtn, webClickable]}
            >
              <Text style={styles.asOfText}>{formatComposerTime(asOf)}</Text>
            </Pressable>
          </View>

          {realOk ? (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Gap</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: aligned ? colors.income : colors.expense },
                ]}
              >
                {aligned ? "None" : formatMoney(gap, { sign: "auto" })}
              </Text>
            </View>
          ) : null}

          <Text style={styles.hint}>{hint}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            {!aligned && realOk ? (
              <Button
                label="ADD MISSING EVENT"
                variant="secondary"
                disabled={busy}
                onPress={() =>
                  void run(() => onAddMissing({ realBalance, asOf, gap }))
                }
              />
            ) : null}
            <Button
              label={aligned ? "SAVE CHECK" : tiny ? "ABSORB" : "ABSORB GAP"}
              variant="primary"
              disabled={busy || !realOk}
              busy={busy}
              onPress={() =>
                void run(() => onSave({ realBalance, asOf, absorb: !aligned }))
              }
            />
            <Button label="CANCEL" variant="ghost" disabled={busy} onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>

      <DatePickerModal
        visible={dateOpen}
        value={asOf}
        onCancel={() => setDateOpen(false)}
        onConfirm={(d) => {
          setAsOf(d);
          setDateOpen(false);
        }}
      />
      <TimePickerModal
        visible={timeOpen}
        value={asOf}
        onCancel={() => setTimeOpen(false)}
        onConfirm={(d) => {
          setAsOf(d);
          setTimeOpen(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.dialog,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  webCard: {
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
  },
  title: { color: colors.accent, fontSize: 18, fontWeight: "700" },
  sub: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  stat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: { color: colors.textSecondary, fontSize: 14 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.inputBg,
    fontSize: 16,
  },
  asOfRow: { flexDirection: "row", gap: 8 },
  asOfBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  asOfText: { color: colors.accent, fontWeight: "600" },
  hint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 13 },
  actions: { gap: 8, marginTop: 6 },
});
